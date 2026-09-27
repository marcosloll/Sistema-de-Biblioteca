const express = require("express");
const cors = require("cors");
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

const app = express();
const PORT = 3000;

const databasePath = path.join(__dirname, "biblioteca.db");
const db = new DatabaseSync(databasePath);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/books", (req, res) => {
  const books = db.prepare("SELECT * FROM Books").all();
  res.json(books);
});

app.post("/books", (req, res) => {
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
  const insertBook = db.prepare(`
        INSERT INTO Books (title, author, year, cover, read, favorite, want_to_read, google_books_id, info_link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

  const result = insertBook.run(
    title,
    author,
    year,
    cover,
    read,
    favorite,
    want_to_read,
    google_books_id,
    info_link,
  );

  res.status(201).json({
    message: "Livro cadastrado com sucesso",
    id: result.lastInsertRowid,
  });
});

app.patch("/books/:id", (req, res) => {
  const id = req.params.id;
  const { read, favorite, want_to_read } = req.body;
  const updateBook = db.prepare(
    "UPDATE Books SET read = ?, favorite = ?, want_to_read = ? WHERE id = ? ",
  );
  const result = updateBook.run(read, favorite, want_to_read, id);
  res.json({
    message: "Livro atualizado",
    changes: result.changes,
  });
});

app.put("/books/:id", (req, res) => {
  const { id } = req.params;

  const { title, author, year } = req.body;

  const sql = `
        UPDATE Books 
        SET title = ?, author = ?, year = ? 
        WHERE id = ?
    `;
  const updateBook = db.prepare(sql);

  const result = updateBook.run(title, author, year, id);

  res.json({
    message: "Livro atualizado com sucesso",
    changes: result.changes,
  });
});

app.delete("/books/:id", (req, res) => {
  const { id } = req.params;

  const deleteBook = db.prepare("DELETE FROM books WHERE id = ?");
  const result = deleteBook.run(id);

  res.json({
    message: "Livro excluído com sucesso.",
    changes: result.changes,
  });
});

app.listen(PORT, () => {
  console.log("http://localhost:3000");
});
