// QR generator using QRCode.js (client-side)
// Library reference: QRCode.js by davidshimjs (no deps)

const input = document.getElementById("url");
const btnMake = document.getElementById("make");
const btnDownload = document.getElementById("download");
const box = document.getElementById("qrcode");

let qr = null;

input.value = "https://antonistheo07.github.io/qr-menu/";


function clearBox() {
  while (box.firstChild) box.removeChild(box.firstChild);
}

function generate(value) {
  clearBox();

  qr = new QRCode(box, {
    text: value,
    width: 220,
    height: 220,
    correctLevel: QRCode.CorrectLevel.M, // good balance for printing
  });
}

btnMake.addEventListener("click", () => {
  const value = input.value.trim();
  if (!value) return alert("Paste your live URL first.");
  generate(value);
});

// Download PNG (works when QRCode.js renders a canvas)
btnDownload.addEventListener("click", () => {
  const canvas = box.querySelector("canvas");
  if (!canvas) return alert("Generate the QR first.");
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "qr-menu.png";
  a.click();
});

// Auto-generate on load (nice for quick printing)
const initial = input.value.trim();
if (initial) generate(initial);
