
/**
 * ====================================================================================
 *   ไฟล์สำหรับแก้ข้อมูลเว็บไซต์ - กลุ่มพัฒนาครูฯ สพป.ชัยนาท
 *   แก้ไขที่นี่ที่เดียว = เปลี่ยนทุกหน้า
 * ====================================================================================
 */

const SITE_DATA = {

    // ================= [1] เมนูเว็บไซต์ =================
    nav: [
        { text: "หน้าหลัก", link: "index.html" },
        { text: "อำนาจหน้าที่", link: "authority.html" },
        { text: "คู่มือการปฏิบัติงาน", link: "manual.html" },
        { text: "แผนพัฒนาครู", link: "plan.html" },
        { text: "ข่าวประชาสัมพันธ์", link: "news.html" },
        { text: "ภาพกิจกรรม", link: "activities.html" },
        { text: "คลังเกียรติบัตร", link: "certificates.html" },
        { text: "บุคลากร", link: "users.html" },
        { text: "แบบฟอร์ม", link: "forms.html" }
    ],

    // ================= [2] ข่าวประชาสัมพันธ์ =================
    // [UPDATED] ข้อมูลถูกย้ายไปที่ assets/data/news.json แล้ว
    // ระบบจะโหลดข้อมูลจากไฟล์ JSON แทน
    news: [],

    // ================= [3] บุคลากรในหน่วยงาน =================
    personnel: [
        {
            id: 1,
            name: "ดร.สมชาย ใจดี",
            position: "ผู้อำนวยการกลุ่ม",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
            phone: "081-234-5678"
        },
        {
            id: 2,
            name: "นางสาวสมหญิง จริงใจ",
            position: "นักทรัพยากรบุคคลชำนาญการ",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
            phone: "089-876-5432"
        }
    ],

    // ================= [4] ลิงก์ดาวน์โหลดแบบฟอร์ม =================
    forms: [
        { name: "แบบขอกลับเข้าปฏิบัติราชการ", link: "https://drive.google.com/file/d/1gB_ds8_a1WIqdJOHFZ-23WMlUxbctOVS/view" },
        { name: "แบบขออนุญาตไปสมัครสอบเพื่อศึกษาต่อภาคนอกเวลา", link: "https://drive.google.com/file/d/1NbmjdvCckSz4znHy_CbwMWenLIlXalX6/view" },
        { name: "แบบขออนุญาตสมัครสอบคัดเลือกเพื่อศึกษาต่อ", link: "https://drive.google.com/file/d/1AjyaFL-yjILq-LA01HPKEhtpvI7vDp27/view" },
        { name: "แบบขออนุญาตไปปฏิบัติงานวิจัย", link: "https://drive.google.com/file/d/1S411w0oxkxN60WQCIUEYxLgKgRaif1vg/view" },
        { name: "แบบคำร้องข​อขยายเวลาศึกษาต่อ", link: "https://drive.google.com/file/d/13BSlm6Nwvo_WXPs8eVsMfqnhEUWu699x/view" },
        { name: "แบบอนุญาตลาศึกษาต่อภาคนอกเวลา", link: "https://drive.google.com/file/d/1chnKHjxVEX_ui_1SsQnBJRxd5xjs7MJO/view" },
        { name: "แบบรายงานผลการศึกษา", link: "https://drive.google.com/file/d/1NVveEYrECOxph_nrxDGLLFuC-k5sJwrT/view" },
        { name: "แบบลาศึกษาต่อภาคปกติ", link: "https://drive.google.com/file/d/18QrZSdJ_nTVP_G_j3dgCbUPS_Q5jY2u5/view" },
        { name: "แบบใบลาอุปสมบท", link: "https://drive.google.com/file/d/13IsMpRwIPkZQomVQGLygYej4ycwNd8s4/view" }
    ],

    // ================= [5] อำนาจหน้าที่ (หัวข้อ) =================
    authority: [
        "ศึกษา วิเคราะห์ วิจัย และเสริมสร้างระบบบริหารงานบุคคลและพัฒนาข้าราชการครูและบุคลากรทางการศึกษา",
        "จัดทำแผนและส่งเสริมการพัฒนาข้าราชการครูและบุคลากรทางการศึกษา",
        "จัดทำทะเบียนประวัติและข้อมูลสารสนเทศเกี่ยวกับข้าราชการครูและบุคลากรทางการศึกษา",
        "เสนอแนะเกี่ยวกับการพิจารณาความดีความชอบ หลักเกณฑ์และวิธีการบริหารงานบุคคล",
        "ปฎิบัติงานร่วมกับหรือสนับสนุนการปฏิบัติงานของหน่วยงานอื่นที่เกี่ยวข้องหรือที่ได้รับมอบหมาย"
    ],

    // ================= [6] คู่มือการปฏิบัติงาน =================
    manuals: [
        { title: "คู่มือการปฏิบัติงานกลุ่มพัฒนาครูและบุคลากรทางการศึกษา", link: "https://drive.google.com/file/d/1GTc9Im3DUHzlRKVtonoDFghA_iPe_AnP/view" },
        { title: "แนวทางการพัฒนาข้าราชการครูและบุคลากรทางการศึกษา สายงานการสอน", link: "https://drive.google.com/file/d/19NvPfDgEgEnOIKq3XQSPH7kJhfTGjglP/view" }
    ],

    // ================= [7] แผนพัฒนาครู =================
    plans: [
        { title: "แผนพัฒนาครูและบุคลากรทางการศึกษา ปีงบประมาณ พ.ศ. 2568", link: "https://drive.google.com/file/d/1gDFpQKAk1taV7ShXMWsOZGku2Ox4CiGC/view" },
        { title: "แผนพัฒนาครูและบุคลากรทางการศึกษา ปีงบประมาณ พ.ศ. 2567", link: "https://drive.google.com/file/d/1Fs0jyjbEGfOl2I0QICOK91kicjSJS1wJ/view" },
        { title: "แผนพัฒนาครูและบุคลากรทางการศึกษา ปีงบประมาณ พ.ศ. 2565", link: "https://drive.google.com/file/d/1XrXk7S9c9YSjrb0y64QHG45WcRpGZXZl/view" },
        { title: "แผนพัฒนาครูและบุคลากรทางการศึกษา ปีงบประมาณ พ.ศ. 2564", link: "https://drive.google.com/file/d/1HBwlg48LShiIySu6vCOr0QWNGqN_2Ltf/view" }
    ],

    // ================= [8] ลิงก์หน่วยงานภายนอก (โลโก้ด้านล่าง) =================
    logos: [
        {
            title: "กระทรวงศึกษาธิการ",
            link: "https://www.moe.go.th/",
            image: "assets/images/logos/moe.png"
        },
        {
            title: "สำนักงาน ก.ค.ศ.",
            link: "https://otepc.go.th/th/",
            image: "assets/images/logos/otepc.png"
        },
        {
            title: "สำนักงาน ก.พ.",
            link: "https://www.ocsc.go.th/homepage/",
            image: "assets/images/logos/ocsc.png"
        },
        {
            title: "สพฐ.",
            link: "https://www.obec.go.th/",
            image: "assets/images/logos/obec.png"
        },
        {
            title: "สพร.",
            link: "https://personnel.obec.go.th/web/",
            image: "assets/images/logos/personnel.png"
        },
        {
            title: "HRMS",
            link: "https://hrms.obec.go.th/",
            image: "assets/images/logos/hrms.png"
        }
    ]
};

