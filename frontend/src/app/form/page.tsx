'use client';

import React, { useState } from 'react';

const SecurityFormPage: React.FC = () => {
    const [license, setLicense] = useState('');
    const [houses, setHouses] = useState<{ house_id: string }[]>([]);
    const [selectedHouse, setSelectedHouse] = useState('');
    const [result, setResult] = useState('');
    const [showHouseSelect, setShowHouseSelect] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLicenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!license.trim()) return;

        setResult(`กำลังค้นหา House ID สำหรับทะเบียน "${license}"...`);
        setShowHouseSelect(false);
        setLoading(true);

        try {
            const housesRes = await fetch(`/api/houses_for_license?license=${encodeURIComponent(license)}`);
            const housesData = await housesRes.json();
            setHouses(housesData);
            if (housesData.length > 0) {
                setShowHouseSelect(true);
                setResult('');
                setSelectedHouse(housesData[0].house_id);
            } else {
                setResult('ไม่พบ House ID ที่ตรงกับทะเบียนนี้');
            }
        } catch (err) {
            setResult('เกิดข้อผิดพลาดในการค้นหา');
        } finally {
            setLoading(false);
        }
    };

    const handleSendToUsers = async () => {
        if (!selectedHouse) return;
        setResult('กำลังแจ้งเตือน...');
        try {
            const res = await fetch('/api/notify_house_users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ house_id: selectedHouse }),
            });
            if (res.ok) {
                setResult(`แจ้งเตือนผู้ใช้งานใน House ID ${selectedHouse} สำเร็จแล้ว!`);
            } else {
                setResult('แจ้งเตือนล้มเหลว ลองใหม่อีกครั้ง');
            }
        } catch (err) {
            setResult('เกิดข้อผิดพลาดในการแจ้งเตือน');
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <h2>กรุณากรอกหมายเลขทะเบียนรถ</h2>
            <form onSubmit={handleLicenseSubmit} autoComplete="off">
                <input
                    type="text"
                    placeholder="กรอกเช่น กข1234"
                    required
                    value={license}
                    onChange={e => setLicense(e.target.value)}
                    style={{ marginRight: 8 }}
                />
                <button type="submit" disabled={loading}>ค้นหา House ID</button>
            </form>

            {showHouseSelect && (
                <div style={{ marginTop: 16 }}>
                    <label htmlFor="houses">เลือก House ID:</label>
                    <select
                        id="houses"
                        value={selectedHouse}
                        onChange={e => setSelectedHouse(e.target.value)}
                        style={{ marginLeft: 8, marginRight: 8 }}
                    >
                        {houses.map(h => (
                            <option key={h.house_id} value={h.house_id}>
                                {h.house_id}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleSendToUsers}>แจ้งเตือนผู้ใช้งาน</button>
                </div>
            )}

            <div style={{ marginTop: 16 }}>{result}</div>
        </div>
    );
};

export default SecurityFormPage;