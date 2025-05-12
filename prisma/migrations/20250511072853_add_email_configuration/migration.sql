-- CreateTable
CREATE TABLE "email_configuration" (
    "id" SERIAL NOT NULL,
    "smtp_host" TEXT NOT NULL,
    "smtp_port" INTEGER NOT NULL,
    "user_email" TEXT NOT NULL,
    "app_password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_configuration_pkey" PRIMARY KEY ("id")
);
