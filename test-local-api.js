async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/locations/countries');
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Is array:", Array.isArray(data));
    console.log("Length:", data.length);
    console.log("First 5 countries:", data.slice(0, 5));
    if (data.error) {
      console.log("API Error:", data.error);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
test();
