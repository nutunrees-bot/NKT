"use client";

export default function PrintButton() {
  return (
    <div className="no-print" style={{ textAlign: "center", margin: "8px 0" }}>
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          padding: "10px 18px",
          fontSize: 14,
          cursor: "pointer",
          borderRadius: 8,
          border: "1px solid #999",
          background: "#fff",
        }}
      >
        🖨️ พิมพ์ / บันทึกเป็น PDF
      </button>
    </div>
  );
}
