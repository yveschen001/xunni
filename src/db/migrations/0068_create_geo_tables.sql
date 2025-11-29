-- Migration: 0068_create_geo_tables.sql

CREATE TABLE IF NOT EXISTS geo_cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ascii_name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  country_code TEXT NOT NULL,
  timezone TEXT NOT NULL
);

CREATE INDEX idx_geo_cities_name ON geo_cities(name);
CREATE INDEX idx_geo_cities_ascii ON geo_cities(ascii_name);
CREATE INDEX idx_geo_cities_country ON geo_cities(country_code);

