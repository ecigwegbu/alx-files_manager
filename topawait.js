// This is your async function that returns a promise
async function fetchData() {
  return "Hello, World!";
}

// Top-level await

const data = await fetchData();
console.log(data); // Output will be "Hello, World!"
