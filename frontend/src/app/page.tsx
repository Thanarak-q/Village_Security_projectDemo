"use client";

import { UUID } from "crypto";
import React, { useState, useEffect } from "react";
// import axios from "axios";
type User = {
  user_id: UUID;
  username:string,
  email:string;
  fname: string;
  lname: string;
  phone: string;
  age: number;
  role_id: UUID;
  status: string;

};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhont] = useState("");
  const [role_id, setRoleId] = useState("")
  const [village_key, setVillage_key] = useState("")

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ดึง users ทั้งหมดเมื่อโหลดหน้าเว็บ

  useEffect(() => {
    fetch("/api/users") // เปลี่ยน url เป็น backend ของคุณ
      .then((res) => res.json())

      .then(setUsers);
  }, []);

  // Submit form สำหรับเพิ่ม user

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    setLoading(true);

    try {

      const res = await fetch("/api/users", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ username, fname, email }),
      });

      if (!res.ok) {
        const data = await res.json();

        throw new Error(data.error ?? "Unknown error");
      }

      const newUser = await res.json();

      setUsers((prev) => [...prev, newUser]);

      setUsername("");

      setFname("");

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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <input
            placeholder="Fname"
            value={fname}
            onChange={(e) => setFname(e.target.value)}
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
          <li key={u.user_id}>
            <p>{u.fname}</p>
            <p>{u.email}</p>

          </li>
        ))}
      </ul>
    </div>
  );
}
