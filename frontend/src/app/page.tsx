"use client";

import React, { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  age: number;
  email: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ดึง users ทั้งหมดเมื่อโหลดหน้าเว็บ

  useEffect(() => {
    fetch("http://localhost:3001/api/users") // เปลี่ยน url เป็น backend ของคุณ
      .then((res) => res.json())

      .then(setUsers);
  }, []);

  // Submit form สำหรับเพิ่ม user

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/users", {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ name, age: Number(age), email }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error ?? "Unknown error");
      }

      const newUser = await res.json();

      setUsers((prev) => [...prev, newUser]);

      setName("");

      setAge("");

      setEmail("");
    } catch (e: any) {
      setError(e.message ?? "Failed to insert user");
    }

    setLoading(false);
  }

  return (
    <div style={{ margin: 20 }}>
      <h1>Users List</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <input
            placeholder="Age"
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            required
            min={1}
          />
        </div>

        <div>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>

      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <b>{u.name}</b> (age: {u.age}) - {u.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
