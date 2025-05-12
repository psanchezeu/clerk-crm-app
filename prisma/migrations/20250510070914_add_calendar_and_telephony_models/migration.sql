-- CreateTable
CREATE TABLE "evento" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "es_todo_el_dia" BOOLEAN NOT NULL DEFAULT false,
    "ubicacion" TEXT,
    "url_videollamada" TEXT,
    "color" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'programado',
    "recordatorio" INTEGER,
    "notas" TEXT,
    "id_propietario" INTEGER NOT NULL,
    "id_cliente" INTEGER,
    "id_lead" INTEGER,
    "id_oportunidad" INTEGER,
    "id_proveedor" INTEGER,
    "id_llamada" INTEGER,
    "es_privado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_participante" (
    "id" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'interno',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "id_usuario" INTEGER,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_participante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedor_telefonia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "api_url" TEXT,
    "api_key" TEXT,
    "api_secret" TEXT,
    "configuracion" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedor_telefonia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llamada_telefonica" (
    "id" SERIAL NOT NULL,
    "id_proveedor" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "numero_origen" TEXT NOT NULL,
    "numero_destino" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "duracion_segundos" INTEGER,
    "estado" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "id_cliente" INTEGER,
    "id_lead" INTEGER,
    "id_oportunidad" INTEGER,
    "grabacion_url" TEXT,
    "notas" TEXT,
    "metadatos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llamada_telefonica_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_propietario_fkey" FOREIGN KEY ("id_propietario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_oportunidad_fkey" FOREIGN KEY ("id_oportunidad") REFERENCES "oportunidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedor_telefonia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_llamada_fkey" FOREIGN KEY ("id_llamada") REFERENCES "llamada_telefonica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_participante" ADD CONSTRAINT "evento_participante_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_participante" ADD CONSTRAINT "evento_participante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llamada_telefonica" ADD CONSTRAINT "llamada_telefonica_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llamada_telefonica" ADD CONSTRAINT "llamada_telefonica_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedor_telefonia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llamada_telefonica" ADD CONSTRAINT "llamada_telefonica_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llamada_telefonica" ADD CONSTRAINT "llamada_telefonica_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llamada_telefonica" ADD CONSTRAINT "llamada_telefonica_id_oportunidad_fkey" FOREIGN KEY ("id_oportunidad") REFERENCES "oportunidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
