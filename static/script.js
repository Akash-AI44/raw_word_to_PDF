/*
  ============================================================
  STEP 1: HTML এর element গুলোকে ধরে নিয়ে variable এ রাখা
  ============================================================
  document.getElementById("xyz") মানে হলো — HTML এ id="xyz" যে element
  আছে সেটাকে খুঁজে JS variable এ ধরিয়ে দাও। এরপর এই variable ব্যবহার করে
  আমরা সেই element এর সাথে কাজ করতে পারব (যেমন: টেক্সট বদলানো,
  দেখানো/লুকানো, event শোনা ইত্যাদি)।
*/
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileNameEl = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("statusText");
const errorEl = document.getElementById("errorMsg");
const downloadLink = document.getElementById("downloadLink"); // নতুন: PDF ডাউনলোড লিংক

// আমরা যে ফাইলটা user সিলেক্ট করেছে সেটা মনে রাখার জন্য একটা variable
let selectedFile = null;

// আগের কনভার্সনের blob URL মনে রাখার জন্য — নতুন কনভার্সন হলে
// আগেরটা মেমোরি থেকে মুছে ফেলতে হবে (নিচে revokeObjectURL এ ব্যাখ্যা আছে)
let currentDownloadUrl = null;

/*
  ============================================================
  STEP 2: dropZone এ ক্লিক করলে আসল (লুকানো) file input টা ক্লিক হবে
  ============================================================
  addEventListener("click", ...) মানে — যখনই dropZone এ ক্লিক হবে,
  ব্র্যাকেটের ভেতরের function টা চলবে।
  আমরা fileInput.click() করে ব্রাউজারের নিজস্ব "ফাইল বেছে নিন" উইন্ডো
  খুলে দিচ্ছি, ইউজারকে দেখাতে হচ্ছে না যে আসল input টা কোথায়।
*/
dropZone.addEventListener("click", () => {
    fileInput.click();
});

/*
  ============================================================
  STEP 3: ইউজার file picker থেকে ফাইল বেছে নিলে কী হবে
  ============================================================
  "change" event ট্রিগার হয় যখন <input type="file"> এ নতুন ফাইল সিলেক্ট হয়।
  event.target.files একটা list — [0] দিয়ে প্রথম (একমাত্র) ফাইলটা নিচ্ছি।
*/
fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        handleFileSelected(file);
    }
});

/*
  ============================================================
  STEP 4: Drag & Drop হ্যান্ডেল করা
  ============================================================
  ব্রাউজারের default behaviour হলো — কোনো ফাইল ড্র্যাগ করে ছাড়লে
  সেটা নতুন ট্যাবে খুলে যায়। আমরা সেটা আটকাতে event.preventDefault()
  ব্যবহার করছি প্রতিটা ধাপে।
*/

// ফাইল drag করে dropZone এর উপর আনলে - visual feedback দিচ্ছি
dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();                 // ব্রাউজারের ডিফল্ট আচরণ বন্ধ
    dropZone.classList.add("drag-over");     // CSS ক্লাস যোগ করে বর্ডার রঙ বদলাচ্ছি
});

// ড্র্যাগ করা ফাইল dropZone থেকে সরে গেলে - আগের চেহারায় ফিরিয়ে দিচ্ছি
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

// ফাইল ছেড়ে দিলে (drop করলে) - এখানেই আসল কাজ হয়
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");

    const file = event.dataTransfer.files[0]; // drag করা ফাইলটা এখান থেকে পাওয়া যায়
    if (file) {
        handleFileSelected(file);
    }
});

/*
  ============================================================
  STEP 5: ফাইল সিলেক্ট হওয়ার পর common logic
  ============================================================
  file picker দিয়ে হোক বা drag-drop দিয়ে হোক — দুই ক্ষেত্রেই এই function
  চলবে। এটা validation করে (শুধু .doc/.docx), তারপর UI আপডেট করে।
*/
function handleFileSelected(file) {
    clearError();
    hideDownloadLink(); // নতুন ফাইল সিলেক্ট করলে আগের ডাউনলোড লিংক (যদি থাকে) লুকিয়ে ফেলছি

    // ফাইলের নামের শেষ অংশ (extension) বের করছি, ছোট হাতের অক্ষরে
    const name = file.name.toLowerCase();
    const isWordFile = name.endsWith(".doc") || name.endsWith(".docx");

    if (!isWordFile) {
        showError("শুধুমাত্র .doc অথবা .docx ফাইল আপলোড করা যাবে।");
        return; // এখানেই function থেমে যাবে, নিচের কোড চলবে না
    }

    selectedFile = file;
    fileNameEl.textContent = `নির্বাচিত ফাইল: ${file.name}`;
    convertBtn.disabled = false; // ফাইল ঠিক থাকলে Convert বাটন সক্রিয় হবে
}

/*
  ============================================================
  STEP 6: Convert বাটনে ক্লিক করলে backend এ পাঠানো
  ============================================================
  এই অংশটাই সবচেয়ে গুরুত্বপূর্ণ — এখানে আমরা backend এর
  POST /convert endpoint কে call করছি।
*/
convertBtn.addEventListener("click", async () => {
    // "async" মানে এই function এর ভেতরে "await" ব্যবহার করা যাবে,
    // যেটা দিয়ে আমরা network request শেষ হওয়া পর্যন্ত অপেক্ষা করব।

    if (!selectedFile) return;

    clearError();
    hideDownloadLink(); // নতুন conversion শুরু করলে আগের ডাউনলোড লিংক লুকিয়ে ফেলছি
    setLoading(true);

    try {
        /*
          FormData হলো ব্রাউজারের একটা built-in object, যেটা দিয়ে
          "multipart/form-data" ফরম্যাটে ফাইল পাঠানো যায় — ঠিক যেভাবে
          backend এর FastAPI endpoint (main.py এর /convert) ফাইল আশা করছে
          (File = File(...) দিয়ে)।
        */
        const formData = new FormData();
        formData.append("file", selectedFile); // key নাম "file" — backend এও parameter নাম "file"

        /*
          fetch() ব্রাউজারের built-in function, এটা দিয়ে server এ
          request পাঠানো হয়।
          - প্রথম argument: URL ("/convert")
          - দ্বিতীয় argument: options object (method, body)
          "await" দিয়ে বলছি — response না আসা পর্যন্ত এখানে থেমে থাকো।
        */
        const response = await fetch("/convert", {
            method: "POST",
            body: formData,
        });

        // response.ok = true হয় যদি HTTP status 200-299 এর মধ্যে হয়
        if (!response.ok) {
            // backend এরর হলে JSON আকারে detail পাঠায় (main.py এর HTTPException থেকে)
            const errorData = await response.json().catch(() => null);
            const message = errorData?.detail || "রূপান্তর ব্যর্থ হয়েছে, আবার চেষ্টা করুন।";
            throw new Error(message);
        }

        /*
          response.blob() দিয়ে raw ফাইল ডেটা (PDF) পাওয়া যায়।
          "Blob" মানে Binary Large Object — ছবি, PDF, ভিডিও এই ধরনের
          বাইনারি ফাইল ব্রাউজারে এভাবেই represent হয়। এটাই "buffer" —
          পুরো PDF ফাইলের raw bytes এই blob এর ভেতরে মেমোরিতে থাকে।
        */
        const pdfBlob = await response.blob();

        /*
          window.URL.createObjectURL(pdfBlob) — এই blob (buffer) থেকে
          একটা সাময়িক URL বানায়, যেমন: blob:http://127.0.0.1:8000/xxxx-xxxx
          এই URL টা সরাসরি সার্ভারে যায় না — এটা ব্রাউজারের নিজের মেমোরির
          মধ্যেই blob টাকে পয়েন্ট করে রাখে। <a href="..."> এ এই URL বসিয়ে
          দিলে ইউজার ক্লিক করলেই ব্রাউজার এই মেমোরি থেকে ফাইলটা ডাউনলোড
          করে দেবে — নতুন করে সার্ভারে কোনো request যাবে না।
        */

        // আগে যদি কোনো blob URL বানানো হয়ে থাকে (আগের কনভার্সন থেকে),
        // সেটা মেমোরি থেকে মুছে ফেলছি — নাহলে প্রতিবার convert করলে
        // মেমোরিতে জমতে থাকবে (memory leak)।
        if (currentDownloadUrl) {
            window.URL.revokeObjectURL(currentDownloadUrl);
        }
        currentDownloadUrl = window.URL.createObjectURL(pdfBlob);

        // মূল ফাইলের নাম থেকে .pdf এক্সটেনশনসহ নতুন নাম বানাচ্ছি
        const baseName = selectedFile.name.replace(/\.(docx|doc)$/i, "");

        /*
          এখন আমরা HTML এ আগে থেকে রাখা <a id="downloadLink"> এর
          href এবং download attribute সেট করে দিচ্ছি, এবং "hidden"
          class সরিয়ে সেটাকে দৃশ্যমান করছি।
          এখানে কোনো .click() নেই — মানে ইউজার নিজে হাতে ক্লিক করে
          তবেই ডাউনলোড হবে, স্বয়ংক্রিয়ভাবে হবে না।
        */
        downloadLink.href = currentDownloadUrl;
        downloadLink.download = `${baseName}.pdf`;
        downloadLink.classList.remove("hidden");

    } catch (err) {
        // fetch fail করলে (যেমন: server বন্ধ, নেটওয়ার্ক সমস্যা) অথবা
        // উপরে throw করা error এখানে ধরা পড়বে
        showError(err.message || "একটি সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
        // try সফল হোক বা catch এ error হোক, শেষে এই অংশ সবসময় চলবে
        setLoading(false);
    }
});

/*
  ============================================================
  STEP 7: ছোট ছোট UI helper function
  ============================================================
  বারবার একই কোড না লিখে, common কাজগুলো function এ ভাগ করে রাখছি।
*/

function setLoading(isLoading) {
    if (isLoading) {
        statusEl.classList.remove("hidden"); // spinner দেখাও
        convertBtn.disabled = true;           // যতক্ষণ convert হচ্ছে, বাটন বন্ধ রাখো
        statusTextEl.textContent = "রূপান্তর হচ্ছে...";
    } else {
        statusEl.classList.add("hidden");
        convertBtn.disabled = !selectedFile;  // ফাইল থাকলে আবার বাটন চালু করো
    }
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
}

function clearError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
}

// ডাউনলোড লিংকটা লুকিয়ে ফেলার ছোট helper — নতুন ফাইল সিলেক্ট বা
// নতুন conversion শুরু হলে ব্যবহার হয়, যাতে আগের PDF এর লিংক ভুলবশত
// দৃশ্যমান না থেকে যায়।
function hideDownloadLink() {
    downloadLink.classList.add("hidden");
    downloadLink.href = "#";
}