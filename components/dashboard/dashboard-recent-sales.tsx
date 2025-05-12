import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RecentSale {
  id: number
  nombre: string
  valor_estimado: number
  cliente_nombre: string
  usuario_nombre: string
}

interface DashboardRecentSalesProps {
  sales: RecentSale[]
}

export function DashboardRecentSales({ sales }: DashboardRecentSalesProps) {
  return (
    <div className="space-y-8">
      {sales.length === 0 ? (
        <div className="text-center text-muted-foreground">No recent sales</div>
      ) : (
        sales.map((sale) => {
          const initials = sale.cliente_nombre
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)

          return (
            <div key={sale.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/diverse-group.png" alt="Avatar" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{sale.cliente_nombre}</p>
                <p className="text-sm text-muted-foreground">{sale.nombre}</p>
              </div>
              <div className="ml-auto font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(sale.valor_estimado || 0)}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
