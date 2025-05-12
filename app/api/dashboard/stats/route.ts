import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUserWithRole, hasPermission } from "@/lib/auth-utils"

// Definir tipos para los resultados de las consultas
type SqlCountResult = { total: string }[]
type SqlSalesResult = { total: string }[]
type SqlMonthlySalesResult = { month: string; total: string }[]
type SqlAvgResult = { avg: string }[]
type SqlConversionResult = { conversion_rate: string }[]
type SqlTeamPerformanceResult = { 
  nombre: string; 
  total_oportunidades: string;
  iniciales: string;
}[]

export async function GET() {
  try {
    const user = await getCurrentUserWithRole()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasViewPermission = await hasPermission("lectura")

    if (!hasViewPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get client count
    const clientCount = await sql`
      SELECT COUNT(*) as total FROM cliente
      WHERE (es_privado = false OR id_propietario = ${user.id})
    ` as SqlCountResult

    // Get active opportunities count
    const opportunityCount = await sql`
      SELECT COUNT(*) as total FROM oportunidad
      WHERE etapa NOT IN ('cerrada-ganada', 'cerrada-perdida')
      AND (es_privado = false OR id_propietario = ${user.id})
    ` as SqlCountResult

    // Get total sales (closed-won opportunities)
    const totalSales = await sql`
      SELECT COALESCE(SUM(valor), 0) as total FROM oportunidad
      WHERE etapa = 'cerrada-ganada'
      AND (es_privado = false OR id_propietario = ${user.id})
    ` as SqlSalesResult

    // Get active tasks count
    const taskCount = await sql`
      SELECT COUNT(*) as total FROM tarea
      WHERE estado != 'Completada'
      AND id_propietario = ${user.id}
    ` as SqlCountResult

    // Get monthly sales data for chart
    const monthlySales = await sql`
      SELECT 
        TO_CHAR(fecha_cierre, 'YYYY-MM') as month,
        SUM(valor) as total
      FROM oportunidad
      WHERE etapa = 'cerrada-ganada'
      AND fecha_cierre >= CURRENT_DATE - INTERVAL '1 year'
      AND (es_privado = false OR id_propietario = ${user.id})
      GROUP BY TO_CHAR(fecha_cierre, 'YYYY-MM')
      ORDER BY month
    ` as SqlMonthlySalesResult

    // Get recent sales
    const recentSales = await sql`
      SELECT o.*, c.nombre_empresa as cliente_nombre, u.nombre as usuario_nombre
      FROM oportunidad o
      LEFT JOIN cliente c ON o.id_cliente = c.id
      LEFT JOIN usuario u ON o.id_propietario = u.id
      WHERE o.etapa = 'cerrada-ganada'
      AND (o.es_privado = false OR o.id_propietario = ${user.id})
      ORDER BY o.fecha_cierre DESC
      LIMIT 5
    `
    
    // ========= MÉTRICAS AVANZADAS CRM =========
    
    // Tasa de conversión de leads a clientes
    const conversionRate = await sql`
      WITH total_leads AS (
        SELECT COUNT(*) as total FROM lead
        WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
        AND (es_privado = false OR id_propietario = ${user.id})
      ),
      converted_leads AS (
        SELECT COUNT(*) as total FROM cliente c
        JOIN lead l ON c.id_lead_origen = l.id
        WHERE c.created_at >= CURRENT_DATE - INTERVAL '90 days'
        AND (c.es_privado = false OR c.id_propietario = ${user.id})
      )
      SELECT 
        CASE 
          WHEN (SELECT total FROM total_leads) = 0 THEN 0
          ELSE ROUND((SELECT total FROM converted_leads)::numeric / (SELECT total FROM total_leads)::numeric * 100, 1)
        END as conversion_rate
    ` as SqlConversionResult
    
    // Duración promedio del ciclo de ventas (en días)
    const avgSalesCycle = await sql`
      SELECT ROUND(AVG(
        EXTRACT(EPOCH FROM (fecha_cierre - fecha_creacion)) / 86400
      )::numeric, 1) as avg
      FROM oportunidad
      WHERE etapa = 'cerrada-ganada'
      AND fecha_cierre >= CURRENT_DATE - INTERVAL '180 days'
      AND (es_privado = false OR id_propietario = ${user.id})
    ` as SqlAvgResult
    
    // Valor medio de oportunidad
    const avgDealSize = await sql`
      SELECT ROUND(AVG(valor)::numeric, 0) as avg
      FROM oportunidad
      WHERE etapa = 'cerrada-ganada'
      AND fecha_cierre >= CURRENT_DATE - INTERVAL '180 days'
      AND (es_privado = false OR id_propietario = ${user.id})
    ` as SqlAvgResult
    
    // Valor total del pipeline (oportunidades abiertas)
    const pipelineValue = await sql`
      SELECT COALESCE(SUM(valor), 0) as total
      FROM oportunidad
      WHERE etapa NOT IN ('cerrada-ganada', 'cerrada-perdida')
      AND (es_privado = false OR id_propietario = ${user.id})
    ` as SqlSalesResult
    
    // Tasa de retención de clientes
    // Nota: Esta es una aproximación basada en clientes que han tenido actividad en los últimos 6 meses
    const clientRetention = await sql`
      WITH active_clients AS (
        SELECT COUNT(DISTINCT c.id) as total
        FROM cliente c
        LEFT JOIN oportunidad o ON c.id = o.id_cliente
        LEFT JOIN tarea t ON c.id = t.id_cliente
        WHERE (o.fecha_actualizacion >= CURRENT_DATE - INTERVAL '180 days' OR
              t.fecha_actualizacion >= CURRENT_DATE - INTERVAL '180 days')
        AND (c.es_privado = false OR c.id_propietario = ${user.id})
      ),
      total_clients AS (
        SELECT COUNT(*) as total FROM cliente
        WHERE created_at <= CURRENT_DATE - INTERVAL '180 days'
        AND (es_privado = false OR id_propietario = ${user.id})
      )
      SELECT 
        CASE 
          WHEN (SELECT total FROM total_clients) = 0 THEN 0
          ELSE ROUND((SELECT total FROM active_clients)::numeric / (SELECT total FROM total_clients)::numeric * 100, 1)
        END as conversion_rate
    ` as SqlConversionResult
    
    // Actividades pendientes esta semana
    const pendingActivities = await sql`
      SELECT COUNT(*) as total
      FROM tarea
      WHERE estado != 'Completada'
      AND fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND id_propietario = ${user.id}
    ` as SqlCountResult

    // Próximas reuniones programadas
    const upcomingMeetings = await sql`
      SELECT COUNT(*) as total
      FROM tarea
      WHERE estado != 'Completada'
      AND tipo = 'Reunión'
      AND fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND id_propietario = ${user.id}
    ` as SqlCountResult
    
    // Rendimiento del equipo (oportunidades por vendedor)
    const teamPerformance = await sql`
      SELECT 
        u.nombre,
        COUNT(o.id) as total_oportunidades,
        CONCAT(LEFT(u.nombre, 1), COALESCE(SUBSTRING(u.nombre FROM POSITION(' ' IN u.nombre) + 1 FOR 1), '')) as iniciales
      FROM usuario u
      LEFT JOIN oportunidad o ON u.id = o.id_propietario
      WHERE o.fecha_creacion >= CURRENT_DATE - INTERVAL '90 days'
      AND o.etapa NOT IN ('cerrada-perdida')
      GROUP BY u.id, u.nombre
      ORDER BY total_oportunidades DESC
      LIMIT 4
    ` as SqlTeamPerformanceResult
    
    // Clientes nuevos en los últimos 30 días
    const recentClients = await sql`
      SELECT 
        c.id, 
        c.nombre_empresa, 
        c.sector,
        c.created_at
      FROM cliente c
      WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND (c.es_privado = false OR c.id_propietario = ${user.id})
      ORDER BY c.created_at DESC
      LIMIT 5
    `
    
    // Ya que tenemos resultados tipados, podemos acceder a ellos de manera segura
    return NextResponse.json({
      // Estadísticas básicas
      clientCount: clientCount.length > 0 ? Number.parseInt(clientCount[0].total) : 0,
      opportunityCount: opportunityCount.length > 0 ? Number.parseInt(opportunityCount[0].total) : 0,
      totalSales: totalSales.length > 0 ? Number.parseFloat(totalSales[0].total) : 0,
      taskCount: taskCount.length > 0 ? Number.parseInt(taskCount[0].total) : 0,
      
      // Métricas CRM avanzadas
      conversionRate: conversionRate.length > 0 ? Number.parseFloat(conversionRate[0].conversion_rate) : 0,
      avgSalesCycle: avgSalesCycle.length > 0 ? Number.parseFloat(avgSalesCycle[0].avg) : 0,
      avgDealSize: avgDealSize.length > 0 ? Number.parseFloat(avgDealSize[0].avg) : 0,
      pipelineValue: pipelineValue.length > 0 ? Number.parseFloat(pipelineValue[0].total) : 0,
      clientRetention: clientRetention.length > 0 ? Number.parseFloat(clientRetention[0].conversion_rate) : 0,
      pendingActivities: pendingActivities.length > 0 ? Number.parseInt(pendingActivities[0].total) : 0,
      upcomingMeetings: upcomingMeetings.length > 0 ? Number.parseInt(upcomingMeetings[0].total) : 0,
      
      // Datos para gráficos y visualizaciones
      monthlySales,
      recentSales,
      teamPerformance,
      recentClients,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
