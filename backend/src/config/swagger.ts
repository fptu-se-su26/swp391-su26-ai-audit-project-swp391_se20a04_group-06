import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HảiSản.vn API Documentation",
      version: "1.0.0",
      description: "Tài liệu API chi tiết cho ứng dụng mua bán hải sản HảiSản.vn",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT Access Token được lưu trong HTTP-Only Cookie",
        },
      },
    },
  },
  apis: [
    "./src/routes/*.ts",
    "./dist/routes/*.js",
    "./backend/src/routes/*.ts",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
export { swaggerSpec };
