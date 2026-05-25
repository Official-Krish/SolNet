import express from "express";
import cors from "cors";
import depinRouter from "./routes/depin";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/v2/depin", depinRouter);

app.listen(9000, () => {
  console.log("Depin Worker server is running on http://localhost:9000");
});
