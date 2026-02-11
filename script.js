let model;
const classNames = [
    "elephant",
    "dog",
    "cat",
    "cow",
    "horse",
    "butterfly",
    "chicken",
    "sheep",
    "human",
    "others"
];


async function loadModel() {
    console.log("Loading model...");
    model = await tf.loadLayersModel('model/model.json');
    console.log("Model loaded!");
}
loadModel();

// -------------------------
// Elements
// -------------------------
const imageUpload = document.getElementById('imageUpload');
const preview = document.getElementById('preview');
const resultText = document.getElementById('result');
const confidenceBar = document.getElementById('confidenceBar');

const startWebcamBtn = document.getElementById('startWebcam');
const webcamVideo = document.getElementById('webcamVideo');

// Create a capture button dynamically
const captureBtn = document.createElement('button');
captureBtn.innerText = "Capture";
captureBtn.style.display = "none";
document.querySelector('.webcam-area').appendChild(captureBtn);

// -------------------------
// Image upload listener
// -------------------------
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    webcamVideo.style.display = "none";
    captureBtn.style.display = "none";

    preview.onload = () => predict(preview);
});

// -------------------------
// Webcam functionality
// -------------------------
startWebcamBtn.addEventListener('click', async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamVideo.srcObject = stream;
        webcamVideo.play();
        webcamVideo.style.display = "block";
        preview.style.display = "none";
        resultText.innerHTML = "";
        captureBtn.style.display = "inline-block"; // show capture button
    } else {
        alert("Webcam not supported in this browser.");
    }
});

// -------------------------
// Capture image from webcam
// -------------------------
captureBtn.addEventListener('click', () => {
    if (!model) {
        alert("Model is still loading. Please wait.");
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = webcamVideo.videoWidth;
    canvas.height = webcamVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);

    // Stop webcam after capture
    webcamVideo.srcObject.getTracks().forEach(track => track.stop());
    webcamVideo.style.display = "none";
    captureBtn.style.display = "none";

    // Show captured image in preview
    preview.src = canvas.toDataURL('image/png');
    preview.style.display = "block";

    preview.onload = () => predict(preview);
});

// -------------------------
// Prediction function
// -------------------------
async function predict(img) {
    if (!model) {
        alert("Model is still loading. Please wait.");
        return;
    }

    // Preprocess image
    const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims();

    // Predict
    const prediction = await model.predict(tensor).data();

    // Get top 3 predictions
    const top3 = Array.from(prediction)
        .map((p, i) => ({ className: classNames[i], probability: p }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3);

    // Display top 3 predictions
    resultText.innerHTML = top3
        .map(p => `${p.className} (${(p.probability * 100).toFixed(2)}%)`)
        .join('<br>');

    // Update confidence bar for top prediction
    confidenceBar.style.width = `${(top3[0].probability * 100).toFixed(2)}%`;

    console.log("Top 3 predictions:", top3);
}
