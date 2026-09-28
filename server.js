import express from "express";
import cors from "cors";
import "dotenv/config";
import { connect } from "@tursodatabase/serverless";

const app = express();
const PORT = process.env.PORT || 3000;

const db = connect({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const createBooksTable = await db.prepare(`CREATE TABLE IF NOT EXISTS Books (
    id integer primary key,
    title varchar (300),
    author varchar (150),
    year int,
    cover varchar (1000),
    read boolean,
    favorite boolean,
    want_to_read boolean,
    google_books_id text,
    info_link text
);`);
await createBooksTable.run();
app.use(cors());
app.use(express.json());

app.get("/books", async (req, res) => {
  const stmt = await db.prepare("SELECT * FROM Books");
  const books = await stmt.all();
  res.json(books);
});

app.post("/books", async (req, res) => {
  const {
    title,
    author,
    year,
    cover,
    read,
    favorite,
    want_to_read,
    google_books_id,
    info_link,
  } = req.body;

  const insertBook = await db.prepare(`
    INSERT INTO Books (title, author, year, cover, read, favorite, want_to_read, google_books_id, info_link) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = await insertBook.run([
    title,
    author,
    year,
    cover,
    read,
    favorite,
    want_to_read,
    google_books_id,
    info_link,
  ]);

  res.status(201).json({
    message: "Livro cadastrado com sucesso",
    id: Number(result.lastInsertRowid),
  });
});

app.patch("/books/:id", async (req, res) => {
  const id = req.params.id;
  const { read, favorite, want_to_read } = req.body;
  const updateBook = await db.prepare(
    "UPDATE Books SET read = ?, favorite = ?, want_to_read = ? WHERE id = ? ",
  );
  const result = await updateBook.run([read, favorite, want_to_read, id]);
  res.json({ message: "Livro atualizado", changes: result.changes });
});

app.put("/books/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, year } = req.body;
  const sql = `
    UPDATE Books SET title = ?, author = ?, year = ? WHERE id = ?
  `;
  const updateBook = await db.prepare(sql);
  const result = await updateBook.run([title, author, year, id]);
  res.json({
    message: "Livro atualizado com sucesso",
    changes: result.changes,
  });
});

app.delete("/books/:id", async (req, res) => {
  const { id } = req.params;
  const deleteBook = await db.prepare("DELETE FROM books WHERE id = ?");
  const result = await deleteBook.run(id);
  res.json({ message: "Livro excluído com sucesso.", changes: result.changes });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
