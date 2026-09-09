import AlsForm from "@/components/print/AlsForm";

/** ฟอร์มเปล่าไว้พิมพ์กรอกมือ — ไม่แตะฐานข้อมูลเลย */
export default function BlankAlsPage() {
  return (
    <AlsForm
      row={{}}
      vitals={[]}
      attachments={{}}
      roleByName={new Map()}
      recordedBy=""
      blank
    />
  );
}
