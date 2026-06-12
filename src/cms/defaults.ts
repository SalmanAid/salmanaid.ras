import {
  PublicLandingContentSchema,
  RoleShellContentSchema,
  richTextFromPlainText,
  type PublicLandingContent,
  type RoleShellContent,
} from "@/schemas/cms.schema";

const id = (value: string) => value;

export const defaultLandingContent: PublicLandingContent = PublicLandingContentSchema.parse({
  schemaVersion: 1,
  seo: {
    title: "SalmanAid : Your Funding Solution",
    description: "Program pendanaan pendidikan berbasis kebajikan oleh Rumah Amal Salman.",
    ogImageUrl: "/landing-banner-image.svg",
  },
  navbar: {
    logoUrl: "/rumah-amal-horizontal-logo.svg",
    logoAlt: "Rumah Amal Salman",
    items: [
      { id: id("91dd2b93-e900-4c23-8838-f37ed1150d5a"), label: "Home", sectionId: "home" },
      { id: id("84b3e571-1a20-4c5d-8e39-63b4e605f99e"), label: "Programs", sectionId: "programs" },
      { id: id("6715ea89-bab1-4ef8-85c2-e73edfb0fb41"), label: "FAQ", sectionId: "faq" },
    ],
    loginLabel: "Masuk",
    registerLabel: "Daftar",
  },
  footer: {
    logoUrl: "/rumah-amal-horizontal-logo.svg",
    logoAlt: "Rumah Amal Salman",
    description: "Sistem pengelolaan pinjaman mahasiswa yang etis dan bebas bunga oleh Rumah Amal Salman. Memberdayakan pendidikan melalui filantropi Islami.",
    groups: [
      {
        id: id("0e7c43a5-e498-4706-824f-f3fd73e6fe45"),
        title: "Tautan",
        links: [
          { id: id("c19cc078-74ec-4838-aee2-486b7cebeee8"), label: "Home", href: "/#home" },
          { id: id("b58b12fa-df22-46d6-a7d9-4de06df72231"), label: "Programs", href: "/#programs" },
          { id: id("d1d47439-4932-41a7-9952-b5a72e988453"), label: "FAQ", href: "/#faq" },
        ],
      },
      {
        id: id("19207af6-73f1-4942-921b-472d7682daf3"),
        title: "Sumber Daya",
        links: [
          { id: id("5e3095be-0c80-4f91-9c3f-2311e631cfb9"), label: "Laporan Transparansi", href: "/" },
          { id: id("5a7dc1bb-855b-4e41-a32a-bfa18eff10e7"), label: "Kebijakan Privasi", href: "/" },
        ],
      },
    ],
    contact: {
      email: "info@rumahamal.org",
      phone: "+62 812 3456 7890",
      address: "Bandung, Jawa Barat, Indonesia",
    },
    copyright: "© 2026 SalmanAid - Rumah Amal Salman. Hak Cipta dilindungi.",
    legalLinks: [
      { id: id("b77e46e0-5bb0-47cc-8d9d-094dcd967d0f"), label: "Privasi", href: "/" },
      { id: id("b917d67c-d2d1-4fc7-87fd-9cb95f499066"), label: "Ketentuan", href: "/" },
    ],
  },
  sections: [
    {
      id: "home",
      type: "hero",
      enabled: true,
      heading: "Memberdayakan Mahasiswa dengan Pinjaman Tanpa Bunga",
      description: richTextFromPlainText("Bekerja sama dengan Rumah Amal Salman, SalmanAid menyediakan bantuan keuangan yang beretika dan sesuai syariah kepada mahasiswa yang membutuhkan tanpa bunga."),
      image: { url: "/landing-banner-image.svg", alt: "Mahasiswa penerima manfaat SalmanAid", focalX: 50, focalY: 50 },
      overlay: "cyan",
      cards: [
        {
          id: id("55051dff-56c1-46c8-b523-f83d2b6bd3f0"),
          title: "Become a Donor",
          description: "Bantu danai pinjaman tanpa bunga dan dukung mahasiswa dalam mewujudkan impian pendidikan mereka.",
          icon: "hand-coins",
          theme: "gold",
          button: {
            id: id("7f180131-8d06-4f48-9086-78dc9bec1a0a"),
            label: "Jadi seorang Donatur",
            href: "/donor/donate-form",
            icon: "heart",
            variant: "primary",
          },
        },
        {
          id: id("59af8e0c-aa9d-4559-a4bf-fc67bc5acace"),
          title: "Apply for a Loan",
          description: "Mahasiswa dapat mengajukan pinjaman tanpa bunga untuk biaya kuliah, buku, dan biaya hidup.",
          icon: "graduation-cap",
          theme: "cyan",
          button: {
            id: id("c56e01fd-5135-4e48-bc60-fb500fd09b87"),
            label: "Ajukan Pinjaman",
            href: "/applicant/apply",
            icon: "graduation-cap",
            variant: "primary",
          },
        },
      ],
    },
    {
      id: "how-it-works",
      type: "howItWorks",
      enabled: true,
      title: "Cara Kerja",
      description: "Proses kami memastikan setiap donasi memberikan dampak nyata dan setiap mahasiswa mendapatkan akses yang adil dan transparan.",
      steps: [
        { id: id("74e5abcb-5877-4e86-b152-a24ac8778c32"), title: "Dana Donasi", description: "Donatur berkontribusi pada dana kolektif untuk memberikan pinjaman tanpa bunga kepada mahasiswa.", color: "gold" },
        { id: id("0912c61d-512e-415d-8285-07883d974f83"), title: "Pengajuan & Verifikasi", description: "Mahasiswa mengirimkan aplikasi yang ditinjau untuk memastikan kelayakan dan transparansi.", color: "cyan" },
        { id: id("d6ef77ef-d21f-4bd8-81be-85e346983395"), title: "Distribusi Berdampak", description: "Pinjaman disalurkan tanpa biaya bunga dan dipantau hingga selesai.", color: "teal" },
      ],
    },
    {
      id: "impact",
      type: "impactStats",
      enabled: true,
      title: "Dampak Kami",
      description: "Setiap angka mewakili kehidupan yang berubah melalui pendanaan pendidikan.",
      cards: [
        { id: id("015aa9a9-8a59-438e-aab4-414aac7ccad9"), metric: "totalDonations", label: "Total Donasi", description: "Dana dari donatur di seluruh Indonesia.", icon: "dollar", prefix: "Rp", suffix: "", format: "full" },
        { id: id("8a934ffc-e5d6-4371-8035-b822678844c5"), metric: "studentsHelped", label: "Mahasiswa Terbantu", description: "Mahasiswa yang menerima dukungan pendidikan.", icon: "users", prefix: "", suffix: "+", format: "full" },
        { id: id("9aa83577-72af-49aa-a425-05b81948df05"), metric: "manual", manualValue: "0", label: "Bebas Bunga", description: "Pendanaan sesuai prinsip syariah dan beretika.", icon: "percent", prefix: "", suffix: "%", format: "plain" },
      ],
    },
    {
      id: "programs",
      type: "programs",
      enabled: true,
      title: "Program Kami",
      description: "Program bantuan yang dirancang untuk mendukung perjalanan pendidikan Anda.",
      programs: [
        {
          id: id("1c81ff25-28d5-4f1d-9b12-a02c27f3d81a"),
          title: "Bantuan Dana Pendidikan",
          summary: "Pinjaman bebas riba untuk biaya kuliah, buku, dan kebutuhan akademik dengan tenor fleksibel.",
          icon: "graduation-cap",
          detail: richTextFromPlainText("Program Pendidikan Madani mendukung mahasiswa berprestasi yang membutuhkan bantuan finansial untuk menyelesaikan pendidikan."),
          terms: ["Mahasiswa aktif", "Mampu menunjukkan kebutuhan finansial", "Melengkapi dokumen pendukung"],
          buttonLabel: "Ajukan Sekarang",
          href: "/applicant/apply",
        },
        {
          id: id("07cbef36-926f-425a-a77a-c82c1e96d76f"),
          title: "Donasi Kilat Emergency",
          summary: "Bantuan cepat bagi mahasiswa yang menghadapi situasi darurat finansial.",
          icon: "heart",
          detail: richTextFromPlainText("Program Donasi Kilat mengumpulkan bantuan secara cepat untuk kebutuhan mendesak dan terverifikasi."),
          terms: ["Kebutuhan bersifat mendesak", "Data penerima telah diverifikasi"],
          buttonLabel: "Lakukan Donasi",
          href: "/donor/donate-form",
        },
      ],
    },
    {
      id: "trust",
      type: "trustTransparency",
      enabled: true,
      title: "Kepercayaan & Transparansi",
      description: "Kami beroperasi dengan transparansi, keamanan, dan pengelolaan keuangan yang beretika.",
      features: [
        { id: id("5f1c2844-e00e-4109-8c72-60ed14125e88"), title: "Secure Payment Gateway", description: "Donasi diproses melalui payment gateway yang aman.", icon: "shield" },
        { id: id("5fc40a43-bd83-488b-857f-bdf86cc4484d"), title: "Transparency Reports", description: "Pelaporan alokasi dan penggunaan dana secara transparan.", icon: "file-text" },
        { id: id("92b02e5c-f782-4594-8826-d07f3a4efadd"), title: "Data Privacy", description: "Data mahasiswa dilindungi melalui kebijakan privasi yang ketat.", icon: "lock" },
      ],
      certifications: [
        { id: id("625e8ad8-17ee-426a-afaf-81f68347714d"), label: "SSL Secured" },
        { id: id("5c39b689-ae8a-49f8-927f-503e329ea008"), label: "Sharia Compliant" },
      ],
    },
    {
      id: "faq",
      type: "faq",
      enabled: true,
      title: "Pertanyaan yang Sering Diajukan",
      description: "Temukan jawaban atas pertanyaan umum tentang program kami.",
      items: [
        { id: id("1d8bdb09-c9f1-468a-90f4-92bb069d630e"), question: "Apakah benar tidak ada bunga sama sekali?", answer: richTextFromPlainText("Ya. SalmanAid menggunakan prinsip qardhul hasan tanpa bunga atau biaya tambahan.") },
        { id: id("c79b41b8-d028-4bb9-9fa5-32fc9f59e46b"), question: "Bagaimana cara mengajukan pinjaman?", answer: richTextFromPlainText("Daftar sebagai peminjam, lengkapi verifikasi akun, lalu isi formulir pengajuan.") },
        { id: id("e14cc7e9-2ddc-441c-ae0f-70f7a40d4219"), question: "Bagaimana transparansi penggunaan donasi?", answer: richTextFromPlainText("Setiap donasi dan penyaluran dicatat serta dapat dipantau melalui sistem.") },
      ],
    },
    {
      id: "cta",
      type: "callToAction",
      enabled: true,
      title: "Siap Untuk Menjadi Agen Perubahan?",
      description: richTextFromPlainText("Dukung masa depan mahasiswa atau ajukan bantuan pendidikan bersama SalmanAid."),
      background: "cyan",
      buttons: [
        { id: id("bb27ce11-682a-4c4f-bacd-5b73cbd22b15"), label: "Lakukan Donasi", href: "/donor/donate-form", icon: "heart", variant: "primary" },
        { id: id("505914a6-7e2b-45e9-a1c4-87f78f3efb8f"), label: "Ajukan Pinjaman", href: "/applicant/apply", icon: "graduation-cap", variant: "outline" },
      ],
    },
  ],
});

const commonFooter = {
  helpLabel: "Pusat Bantuan",
  helpHref: "/#faq",
  contactLabel: "Hubungi Kami",
  contactHref: "https://rumahamal.org",
  privacyLabel: "Kebijakan Privasi",
  privacyHref: "/",
  copyright: "© 2026 SalmanAid - Rumah Amal Salman",
};

export const defaultBorrowerAgreement: NonNullable<RoleShellContent["borrowerAgreement"]> = {
  sectionTitle: "Syarat dan Ketentuan",
  sectionDescription: "Mohon review dan terima kesepakatan pinjaman",
  agreementTitle: "Kesepakatan Pinjaman Bebas Bunga",
  introduction: "Dengan mengirimkan aplikasi ini, Anda mengakui dan menyetujui syarat dan ketentuan berikut dari program pinjaman pelajar tanpa bunga Rumah Amal Salman:",
  explanation: "Ini adalah pinjaman tanpa bunga (Qardhul Hasan) yang diberikan untuk mendukung pendidikan Anda melalui prinsip-prinsip filantropi Islami.",
  terms: [
    "Anda setuju untuk membayar kembali jumlah pinjaman dalam cicilan bulanan sesuai kesepakatan setelah persetujuan pinjaman.",
    "Tidak ada bunga atau biaya tambahan yang akan dikenakan pada pinjaman ini. Jumlah pembayaran kembali sama dengan jumlah pinjaman.",
    "Semua informasi yang diberikan dalam aplikasi ini akurat dan benar sejauh pengetahuan Anda.",
    "Anda memberi wewenang kepada Rumah Amal Salman untuk memverifikasi informasi dan dokumen yang diberikan.",
    "Anda berkomitmen untuk menggunakan dana pinjaman semata-mata untuk tujuan pendidikan sebagaimana dinyatakan dalam permohonan Anda.",
  ],
  hardshipText: "Dalam hal mengalami kesulitan keuangan, Anda setuju untuk segera berkomunikasi dengan Rumah Amal Salman untuk membahas pengaturan pembayaran alternatif.",
  closingText: "Anda memahami bahwa pinjaman ini adalah amanah dan Anda secara moral dan etis berkewajiban untuk mengembalikannya secara bertanggung jawab.",
  checkboxLabel: "Saya telah membaca dan menyetujui syarat dan ketentuan perjanjian pinjaman tanpa bunga. Saya menegaskan bahwa semua informasi yang diberikan akurat dan saya berkomitmen untuk memenuhi kewajiban pembayaran kembali saya.",
};

export const defaultBorrowerShell: RoleShellContent = RoleShellContentSchema.parse({
  schemaVersion: 1,
  logoUrl: "/rumah-amal-horizontal-logo.svg",
  logoAlt: "Rumah Amal Salman",
  menuLabels: {
    dashboard: "Dashboard",
    apply: "Pengajuan Pinjaman",
    installment: "Cicilan",
    profile: "Profil",
    logout: "Logout",
  },
  helpText: "Butuh bantuan terkait pengajuan atau cicilan?",
  borrowerAgreement: defaultBorrowerAgreement,
  footer: commonFooter,
});

export const defaultDonorShell: RoleShellContent = RoleShellContentSchema.parse({
  schemaVersion: 1,
  logoUrl: "/rumah-amal-horizontal-logo.svg",
  logoAlt: "Rumah Amal Salman",
  menuLabels: {
    dashboard: "Dashboard",
    donate: "Donasi",
    profile: "Profil",
    logout: "Logout",
  },
  helpText: "Butuh bantuan terkait donasi dan distribusi dana?",
  footer: commonFooter,
});
