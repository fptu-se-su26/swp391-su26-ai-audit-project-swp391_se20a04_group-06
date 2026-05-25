/**
 * db.migrations.ts — updated
 * Migrations: Notification, IsVerified, Favorite, ViewCount, Report
 */
import mysql from "mysql2/promise";

export async function runMigrations(conn: mysql.PoolConnection): Promise<void> {
  await createNotificationTable(conn);
  await createFavoriteTable(conn);
  await createReportTable(conn);
  await runColumnMigrations(conn);
  console.log("✅ Database schema ready");
}

async function createNotificationTable(conn: mysql.PoolConnection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS Notification (
      NotificationID INT AUTO_INCREMENT PRIMARY KEY,
      UserID         INT          NOT NULL,
      Type           VARCHAR(50)  NOT NULL,
      Content        TEXT         NOT NULL,
      IsRead         TINYINT(1)   NOT NULL DEFAULT 0,
      CreatedAt      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ProductID      INT          NULL,
      ReviewID       INT          NULL,
      FOREIGN KEY (UserID)    REFERENCES User(UserID)    ON DELETE CASCADE,
      FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE,
      FOREIGN KEY (ReviewID)  REFERENCES Review(ReviewID)   ON DELETE CASCADE
    )
  `);
}

async function createFavoriteTable(conn: mysql.PoolConnection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS Favorite (
      FavoriteID INT AUTO_INCREMENT PRIMARY KEY,
      UserID     INT      NOT NULL,
      ProductID  INT      NOT NULL,
      CreatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (UserID)    REFERENCES User(UserID)    ON DELETE CASCADE,
      FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE,
      UNIQUE KEY unique_favorite (UserID, ProductID)
    )
  `);
}

async function createReportTable(conn: mysql.PoolConnection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS Report (
      ReportID   INT AUTO_INCREMENT PRIMARY KEY,
      ReporterID INT          NOT NULL,
      ProductID  INT          NOT NULL,
      Reason     VARCHAR(200) NOT NULL,
      Status     ENUM('Pending','Resolved','Dismissed') NOT NULL DEFAULT 'Pending',
      AdminNote  TEXT         NULL,
      CreatedAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ReporterID) REFERENCES User(UserID)    ON DELETE CASCADE,
      FOREIGN KEY (ProductID)  REFERENCES Product(ProductID) ON DELETE CASCADE
    )
  `);
}

async function runColumnMigrations(conn: mysql.PoolConnection): Promise<void> {
  const migrations: Array<{ table: string; column: string; sql: string }> = [
    {
      table: "Notification", column: "ProductID",
      sql: `ALTER TABLE Notification ADD COLUMN ProductID INT NULL, ADD CONSTRAINT fk_notif_product FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE`,
    },
    {
      table: "Notification", column: "ReviewID",
      sql: `ALTER TABLE Notification ADD COLUMN ReviewID INT NULL, ADD CONSTRAINT fk_notif_review FOREIGN KEY (ReviewID) REFERENCES Review(ReviewID) ON DELETE CASCADE`,
    },
    {
      table: "User", column: "IsVerified",
      sql: `ALTER TABLE User ADD COLUMN IsVerified TINYINT(1) NOT NULL DEFAULT 0`,
    },
    {
      table: "Product", column: "ViewCount",
      sql: `ALTER TABLE Product ADD COLUMN ViewCount INT NOT NULL DEFAULT 0`,
    },
    {
      table: "Product", column: "BumpedAt",
      sql: `ALTER TABLE Product ADD COLUMN BumpedAt DATETIME NULL`,
    },
  ];

  for (const m of migrations) {
    try {
      const [cols] = await conn.query(`SHOW COLUMNS FROM \`${m.table}\` LIKE '${m.column}'`);
      if ((cols as any[]).length === 0) {
        await conn.query(m.sql);
        console.log(`✅ Migration: added ${m.table}.${m.column}`);
      }
    } catch (err) {
      console.error(`⚠️  Migration ${m.table}.${m.column}:`, (err as Error).message);
    }
  }
}
