DROP TABLE IF EXISTS webhook_events;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  image TEXT,
  description TEXT
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (user_email),
  INDEX idx_status (status),
  UNIQUE INDEX idx_stripe_pi (stripe_payment_intent_id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_id (order_id)
);

CREATE TABLE webhook_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  order_id INT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'processed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stripe_event (stripe_event_id),
  INDEX idx_order_id (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

INSERT INTO products (name, price, category, image, description) VALUES
("Konya Tahinli Pide", 80, "Yöresel Lezzetler", "", "Konya taş fırınında pişmiş taze tahinli pide."),
("El Yapımı Bakır Cezve", 350, "El Sanatları", "", "Elde dövme bakır, kalaylı, ince işçilik cezve."),
("Hakiki Deri Cüzdan", 420, "Aksesuar", "", "Tamamen hakiki deriden, el kesimi ve el dikişi cüzdan."),
("El Dokuma Kilim", 2200, "Ev Dekoru", "", "Anadolu motifleriyle el dokuması, yün kilim."),
("Doğal Zeytinyağı 5L", 780, "Gıda", "", "Soğuk sıkım, katkısız naturel sızma zeytinyağı.");
