#!/usr/bin/env python3
"""
Ayan Business Ecosystem Backend Server
Powered by Python 3 & SQLite3 Database
Serves REST API + Static Web Assets for SSS Logistic, Ayan Cafe, and Ayan Mobile
"""

import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse
from datetime import datetime

PORT = 8000
DB_FILE = "ayan_ecosystem.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Shipments Table (SSS Logistic)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shipments (
            id TEXT PRIMARY KEY,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            status TEXT NOT NULL,
            progress_pct INTEGER NOT NULL,
            sender_name TEXT,
            steps_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Cafe Menu Table (Ayan Cafe)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cafe_menu (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            tag TEXT,
            image_url TEXT
        )
    ''')

    # 3. Cafe Orders Table (Ayan Cafe)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cafe_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT NOT NULL,
            total_amount REAL NOT NULL,
            items_json TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 4. Cafe Reservations Table (Ayan Cafe)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cafe_reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guest_name TEXT NOT NULL,
            guests INTEGER NOT NULL,
            reservation_time TEXT NOT NULL,
            status TEXT DEFAULT 'CONFIRMED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Mobile Catalog Table (Ayan Mobile)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mobile_catalog (
            id TEXT PRIMARY KEY,
            brand TEXT NOT NULL,
            title TEXT NOT NULL,
            badge TEXT,
            price TEXT NOT NULL,
            specs_json TEXT NOT NULL,
            image_url TEXT
        )
    ''')

    # 6. Mobile Repairs Table (Ayan Mobile)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mobile_repairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            issue TEXT NOT NULL,
            estimated_cost REAL NOT NULL,
            customer_name TEXT,
            customer_phone TEXT,
            status TEXT DEFAULT 'SCHEDULED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed Initial Data if empty
    cursor.execute("SELECT COUNT(*) FROM shipments")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)

    conn.commit()
    conn.close()
    print("[DB] SQLite Database initialized successfully!")

def seed_data(cursor):
    # Seed Shipments
    shipments = [
        ('SSS-88921', 'Mumbai Central Hub', 'Ahmedabad Express Warehouse', 'IN TRANSIT', 66, 'Ayan Enterprise', json.dumps([
            {'title': 'Picked Up', 'time': 'Sep 06, 09:30 AM', 'status': 'completed'},
            {'title': 'Sorting Hub', 'time': 'Sep 07, 02:15 PM', 'status': 'completed'},
            {'title': 'In Transit', 'time': 'Sep 08, 08:00 AM', 'status': 'active'},
            {'title': 'Out for Delivery', 'time': 'Expected Today', 'status': 'pending'}
        ])),
        ('SSS-10492', 'Surat Depot', 'Delhi NCR Gateway', 'DELIVERED', 100, 'Global Logistics Ltd', json.dumps([
            {'title': 'Picked Up', 'time': 'Sep 04, 11:00 AM', 'status': 'completed'},
            {'title': 'Sorting Hub', 'time': 'Sep 05, 04:30 PM', 'status': 'completed'},
            {'title': 'In Transit', 'time': 'Sep 06, 09:00 AM', 'status': 'completed'},
            {'title': 'Delivered', 'time': 'Sep 07, 01:20 PM', 'status': 'completed'}
        ])),
        ('SSS-55301', 'Bangalore Tech Park', 'Mumbai Port Hub', 'PROCESSING', 25, 'Tech Retailers', json.dumps([
            {'title': 'Order Created', 'time': 'Sep 08, 10:15 AM', 'status': 'completed'},
            {'title': 'Courier Assigned', 'time': 'Sep 08, 11:00 AM', 'status': 'active'},
            {'title': 'In Transit', 'time': 'Pending Pickup', 'status': 'pending'},
            {'title': 'Out for Delivery', 'time': 'Expected Sep 10', 'status': 'pending'}
        ]))
    ]
    cursor.executemany("INSERT INTO shipments (id, origin, destination, status, progress_pct, sender_name, steps_json) VALUES (?, ?, ?, ?, ?, ?, ?)", shipments)

    # Seed Cafe Menu
    menu = [
        ('c1', 'Ayan Signature Espresso', 'coffee', 180, 'Double shot dark roast Arabica espresso with silky crema.', 'Best Seller', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80'),
        ('c2', 'Hazelnut Cold Brew', 'coffee', 240, 'Steeped for 18 hours, infused with hazelnut & cold milk foam.', 'Chef Special', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80'),
        ('c3', 'Caramel Macchiato Latte', 'coffee', 220, 'Steamed velvet milk, vanilla syrup topped with rich espresso caramel drizzle.', 'Popular', 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=400&q=80'),
        ('b1', 'Nutella Thick Shake', 'beverage', 260, 'Rich hazelnut cocoa cocoa shake topped with crushed waffle cone.', 'Kids Favorite', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80'),
        ('b2', 'Berry Blast Cooler', 'beverage', 190, 'Fresh blueberries, mint leaves, soda, and lime squeeze.', 'Refreshing', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80'),
        ('s1', 'Ayan Gourmet Cheese Burger', 'snacks', 290, 'Prime patty, melted cheddar, caramelised onions & truffle mayo.', 'Must Try', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'),
        ('s2', 'Wood-Fired Paneer Tikka Pizza', 'snacks', 420, 'Hand-tossed crust, charred cottage cheese, capsicum & mozzarella.', 'Hot Seller', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80'),
        ('d1', 'Belgian Chocolate Lava Cake', 'dessert', 210, 'Warm chocolate cake with oozing molten ganache center.', 'Sweet Delight', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80')
    ]
    cursor.executemany("INSERT INTO cafe_menu (id, name, category, price, description, tag, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)", menu)

    # Seed Mobile Catalog
    mobiles = [
        ('m1', 'Apple', 'iPhone 15 Pro Max', 'Flagship', '₹1,34,900', json.dumps(['Titanium Design with A17 Pro', '48MP Main Camera + 5x Telephoto', 'Super Retina XDR 120Hz']), 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80'),
        ('m2', 'Samsung', 'Galaxy S24 Ultra', 'AI Powered', '₹1,29,999', json.dumps(['Built-in S Pen & Armor Aluminum', '200MP Quad Telephoto Camera', 'Snapdragon 8 Gen 3 for Galaxy']), 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80'),
        ('m3', 'OnePlus', 'OnePlus 12 5G', 'Speed King', '₹64,999', json.dumps(['Hasselblad 4th Gen Camera', '100W SUPERVOOC Fast Charge', '4500 nits Peak Brightness']), 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80'),
        ('a1', 'Accessory', 'AirPods Pro (2nd Gen)', 'Best Audio', '₹22,900', json.dumps(['Active Noise Cancellation', 'Spatial Audio with Head Tracking', 'USB-C MagSafe Charging Case']), 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=400&q=80')
    ]
    cursor.executemany("INSERT INTO mobile_catalog (id, brand, title, badge, price, specs_json, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)", mobiles)

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # API Endpoints
        if path == '/api/tracking':
            code = query.get('id', [''])[0].strip().upper()
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM shipments WHERE id = ?", (code,))
            row = cursor.fetchone()
            conn.close()

            if row:
                res = dict(row)
                res['steps'] = json.loads(res['steps_json'])
                del res['steps_json']
                return self.send_json({'success': True, 'data': res})
            else:
                return self.send_json({'success': False, 'message': 'Shipment code not found'}, status=404)

        elif path == '/api/cafe/menu':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM cafe_menu")
            rows = cursor.fetchall()
            conn.close()
            items = [dict(r) for r in rows]
            return self.send_json({'success': True, 'data': items})

        elif path == '/api/mobile/catalog':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM mobile_catalog")
            rows = cursor.fetchall()
            conn.close()
            items = []
            for r in rows:
                item = dict(r)
                item['specs'] = json.loads(item['specs_json'])
                del item['specs_json']
                items.append(item)
            return self.send_json({'success': True, 'data': items})

        elif path == '/api/stats':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM shipments")
            ship_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM cafe_orders")
            order_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM mobile_repairs")
            repair_count = cursor.fetchone()[0]
            conn.close()

            return self.send_json({
                'success': True,
                'data': {
                    'shipments': ship_count + 50000,
                    'orders': order_count + 120000,
                    'repairs': repair_count + 15000
                }
            })

        # Static File Serving fallback
        return super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
        except Exception:
            payload = {}

        path = self.path

        # 1. Book Freight Cargo Shipment
        if path == '/api/tracking':
            code = payload.get('code')
            address = payload.get('address', 'Customer Pickup Location')
            name = payload.get('name', 'Anonymous')
            
            steps = [
                {'title': 'Pickup Scheduled', 'time': 'Today', 'status': 'active'},
                {'title': 'In Sorting Hub', 'time': 'Pending', 'status': 'pending'},
                {'title': 'In Transit', 'time': 'Pending', 'status': 'pending'},
                {'title': 'Delivered', 'time': 'Pending', 'status': 'pending'}
            ]

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO shipments (id, origin, destination, status, progress_pct, sender_name, steps_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (code, address, 'Central Distribution Hub', 'BOOKED', 15, name, json.dumps(steps))
            )
            conn.commit()
            conn.close()

            return self.send_json({'success': True, 'message': 'Freight shipment booked!', 'code': code})

        # 2. Place Cafe Order
        elif path == '/api/cafe/orders':
            order_num = f"ORD-{int(datetime.now().timestamp())}"
            total = payload.get('total', 0)
            items = payload.get('items', [])

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO cafe_orders (order_number, total_amount, items_json) VALUES (?, ?, ?)",
                (order_num, total, json.dumps(items))
            )
            conn.commit()
            conn.close()

            return self.send_json({'success': True, 'order_number': order_num, 'message': 'Cafe order confirmed!'})

        # 3. Book Cafe Table Reservation
        elif path == '/api/cafe/reservations':
            name = payload.get('name')
            guests = payload.get('guests', 2)
            time = payload.get('time')

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO cafe_reservations (guest_name, guests, reservation_time) VALUES (?, ?, ?)",
                (name, guests, time)
            )
            conn.commit()
            conn.close()

            return self.send_json({'success': True, 'message': f'Table reserved for {name} ({guests} guests)'})

        # 4. Book Mobile Repair
        elif path == '/api/mobile/repairs':
            brand = payload.get('brand')
            model = payload.get('model')
            issue = payload.get('issue')
            cost = payload.get('cost', 1499)
            name = payload.get('name', 'Customer')
            phone = payload.get('phone', 'N/A')

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO mobile_repairs (brand, model, issue, estimated_cost, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?, ?)",
                (brand, model, issue, cost, name, phone)
            )
            conn.commit()
            conn.close()

            return self.send_json({'success': True, 'message': f'Repair appointment confirmed for {brand} {model}!'})

        return self.send_json({'error': 'Invalid endpoint'}, status=404)

def run():
    init_db()
    server_address = ('', PORT)
    httpd = socketserver.TCPServer(server_address, RequestHandler)
    print(f"[SERVER] Ayan Business Ecosystem Backend Server running on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
