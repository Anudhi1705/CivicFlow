import { MongoClient } from "mongodb";

const uri =
"mongodb://mishraanudhi882_db_user:CivicFlow2026@ac-e9c5wdj-shard-00-00.vfaklsg.mongodb.net:27017,ac-e9c5wdj-shard-00-01.vfaklsg.mongodb.net:27017,ac-e9c5wdj-shard-00-02.vfaklsg.mongodb.net:27017/?ssl=true&replicaSet=atlas-mo47ed-shard-0&authSource=admin&appName=Cluster0";

const client = new MongoClient(uri);

try {
  console.log("Connecting...");
  await client.connect();
  console.log("✅ Connected Successfully");

  await client.close();
} catch (err) {
  console.error(err);
}