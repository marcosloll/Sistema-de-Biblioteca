CREATE TABLE Books (
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
);

insert into Books (title, author, year, cover, read,favorite, want_to_read)
VALUES (
    'Duna',
    'Frank Herbert',
    1965,
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiZctRm0RR8dsCRKNPDWdUx5PpWVvLzIhSi0hQG6WZFwSG_iK9Kt-yIJtF&s=10',
    1,
    1,
    0
);

insert into Books (title, author, year, cover, read, favorite, want_to_read)
VALUES(
    'The Hobbit',
    'J. R. R. Tolkien',
    1937,
    'https://static.wikia.nocookie.net/terramedia/images/e/e6/CapHobbit.webp/revision/latest/scale-to-width-down/320?cb=20230827203306',
    1,
    0,
    0
);

insert into Books (title, author, year, cover, read, favorite, want_to_read)
VALUES (
    'The Odyssey',
    'Homer',
    -700,
    'https://i.pinimg.com/1200x/b0/20/7d/b0207d916758eb43dac0ad4e2c9dfdeb.jpg',
    0,
    0,
    1
);

insert into Books (title, author, year, cover, read, favorite, want_to_read)
VALUES (
    '1984',
    'George Orwell',
    1949,
    'https://cdn.waterstones.com/bookjackets/large/9780/1410/9780141036144.jpg',
    1,
    0,
    0
);
