/*
  Warnings:

  - You are about to drop the `oauth_token` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "oauth_token" DROP CONSTRAINT "oauth_token_id_usuario_fkey";

-- DropTable
DROP TABLE "oauth_token";
