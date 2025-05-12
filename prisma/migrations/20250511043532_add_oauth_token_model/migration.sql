-- CreateTable
CREATE TABLE "oauth_token" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_type" TEXT,
    "expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_token_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "oauth_token" ADD CONSTRAINT "oauth_token_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
