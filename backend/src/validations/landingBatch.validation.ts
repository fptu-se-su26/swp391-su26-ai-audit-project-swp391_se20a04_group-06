import { z } from "zod";

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) =>
      value === undefined || value === null || value === ""
        ? undefined
        : Number(value),
    z.number().min(min).max(max).optional(),
  );

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const locationSchema = z
  .object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  })
  .optional();

const landingBatchFields = {
  title: z.string().trim().min(2, "Tên vựa cá quá ngắn").max(160),
  description: optionalText(3000),
  boatName: optionalText(120),
  catchArea: optionalText(200),
  catchTime: z.string().datetime().optional().nullable(),
  landingTime: z.string().datetime().optional().nullable(),
  origin: optionalText(200),
  lat: optionalNumber(-90, 90),
  lng: optionalNumber(-180, 180),
  location: locationSchema,
  images: z.array(z.string().url()).max(8).optional(),
  status: z.enum(["Active", "Closed"] as const).optional(),
  boatLogId: z.string().optional().nullable(),
};

const productRowSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    category: z.enum([
      "Fish",
      "Shrimp",
      "Squid",
      "Crab",
      "Shellfish",
      "Others",
    ] as const),
    type: z.enum(["Fresh", "Dried"] as const),
    price: z.coerce.number().positive("Giá phải lớn hơn 0"),
    totalWeight: z.coerce.number().positive("Tổng kg phải lớn hơn 0"),
    remainingWeight: z.coerce.number().nonnegative().optional(),
    salesType: z.enum(["Retail", "Wholesale"] as const).optional(),
    description: optionalText(2000),
    catchTime: z.string().datetime().optional().nullable(),
    origin: optionalText(200),
    expiryDate: z.string().datetime().optional().nullable(),
    lat: optionalNumber(-90, 90),
    lng: optionalNumber(-180, 180),
    images: z.array(z.string().url()).max(5).optional(),
  })
  .refine(
    (product) =>
      product.remainingWeight === undefined ||
      product.remainingWeight <= product.totalWeight,
    {
      message: "Khối lượng còn lại không thể lớn hơn tổng khối lượng",
      path: ["remainingWeight"],
    },
  );

export const createLandingBatchSchema = z.object({
  body: z.object(landingBatchFields),
});

export const updateLandingBatchSchema = z.object({
  body: z.object(landingBatchFields).partial(),
});

export const addLandingBatchProductsSchema = z.object({
  body: z.object({
    products: z
      .array(productRowSchema)
      .min(1, "Cần ít nhất một sản phẩm")
      .max(30, "Tối đa 30 sản phẩm mỗi lần"),
  }),
});
