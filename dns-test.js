import dns from "node:dns";

dns.resolveSrv("_mongodb._tcp.cluster0.u9sbrj9.mongodb.net", (err, records) => {
  console.log("Error:", err);
  console.log("Records:", records);
});