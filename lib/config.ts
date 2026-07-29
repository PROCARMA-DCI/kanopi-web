export const fastapi =
  process.env.NODE_ENV == "development"
    ? process.env.NEXT_PUBLIC_DEV_API_SERVER_HOST
    : process.env.NEXT_PUBLIC_PROD_API_SERVER_HOST;
