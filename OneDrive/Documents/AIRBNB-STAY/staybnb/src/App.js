import { useState, useEffect, useContext, createContext, useRef } from "react";

/* =============================================
   AUTHOR / ADMIN CREDENTIALS
   Author logs in with this special email+password
   Customers register with their own emails
============================================= */
const AUTHOR = {
  email: "staynb.sandeep@gmail.com",
  password: "sandeep@2026",
  name: "Sandeep (Host)",
  role: "host",
  avatar: "https://ui-avatars.com/api/?name=Sandeep+Host&background=FF385C&color=fff&bold=true&size=128",
};


// BOOKINGS_STORE is defined after BOOKINGS_DATA below

// In-memory customer registry (persists during session)

// Customer bookings registry
// eslint-disable-next-line no-unused-vars
const CUSTOMER_BOOKINGS = new Map();

/* =============================================
   CUSTOMERS DB — persists to localStorage
   Once registered, customer stays until host removes
============================================= */
const CUSTOMERS_DB = (() => {
  const LS_KEY = "staybnb_customers";

  const readLS  = () => { try { const s=localStorage.getItem(LS_KEY); return s ? new Map(JSON.parse(s)) : new Map(); } catch(e){ return new Map(); } };
  const writeLS = (map) => { try { localStorage.setItem(LS_KEY, JSON.stringify([...map])); } catch(e){} };

  const _listeners = [];
  const notify = () => _listeners.forEach(fn => fn(Array.from(readLS().values())));

  return {
    has:    (k) => readLS().has(k),
    get:    (k) => readLS().get(k),
    set:    (k, v) => { const m=readLS(); m.set(k,v); writeLS(m); notify(); return m; },
    delete: (k) => { const m=readLS(); m.delete(k); writeLS(m); notify(); },
    values: () => readLS().values(),
    getAll: () => Array.from(readLS().values()),
    get size() { return readLS().size; },
    subscribe: (fn) => {
      _listeners.push(fn);
      return () => { const i=_listeners.indexOf(fn); if(i>-1) _listeners.splice(i,1); };
    },
  };
})();



/* =============================================
   MUST-VISIT PLACES  (iconic spots, real images)
============================================= */
const PLACES = [
  { id:"p1", name:"Taj Mahal", city:"Agra", state:"Uttar Pradesh", region:"North", category:"Monument", visitors:"7M+/yr",
    img:"https://i.natgeofe.com/n/8eba070d-14e5-4d07-8bab-9db774029063/93080.jpg",
    desc:"Ivory-white marble mausoleum on the southern bank of the Yamuna", tags:["UNESCO", "Heritage", "Photography"], color:"#f59e0b" },
  { id:"p2", name:"Red Fort", city:"Delhi", state:"Delhi", region:"North", category:"Fort", visitors:"3M+/yr",
    img:"https://images.indianexpress.com/2018/06/red-fort-759-getty-images.jpg",
    desc:"Magnificent 17th-century Mughal citadel in the heart of Old Delhi", tags:["UNESCO", "History", "Architecture"], color:"#ef4444" },
  { id:"p3", name:"Hawa Mahal", city:"Jaipur", state:"Rajasthan", region:"North", category:"Palace", visitors:"4M+/yr",
    img:"https://miro.medium.com/1*fYA-b-KA9UUqPL2OsDYkQw.png",
    desc:"Palace of Winds — five-storey honeycomb façade with 953 jharokhas", tags:["Heritage", "Architecture", "Photography"], color:"#f97316" },
  { id:"p4", name:"Varanasi Ghats", city:"Varanasi", state:"Uttar Pradesh", region:"North", category:"Spiritual", visitors:"6M+/yr",
    img:"https://varanasismartcity.gov.in/assets/images/images/MunshiGhat.jpg",
    desc:"Ancient ghats on the sacred Ganges — cradle of Hindu civilization", tags:["Spiritual", "Culture", "Sunrise"], color:"#8b5cf6" },
  { id:"p5", name:"Mehrangarh Fort", city:"Jodhpur", state:"Rajasthan", region:"North", category:"Fort", visitors:"2M+/yr",
    img:"https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0f/99/ae/7f/images-14-largejpg.jpg?w=700&h=400&s=1",
    desc:"Towering 400ft above Jodhpur, one of India's largest and grandest forts", tags:["Fort", "Heritage", "Views"], color:"#3b82f6" },
  { id:"p6", name:"Golden Temple", city:"Amritsar", state:"Punjab", region:"North", category:"Spiritual", visitors:"100k+/day",
    img:"https://static.toiimg.com/photo/61820954/.jpg",
    desc:"Holiest Sikh shrine sheathed in 750kg of pure gold, surrounded by Amrit Sarovar", tags:["Spiritual", "Sacred", "Architecture"], color:"#f59e0b" },
  { id:"p7", name:"Kerala Backwaters", city:"Alleppey", state:"Kerala", region:"South", category:"Nature", visitors:"1M+/yr",
    img:"https://www.tripsavvy.com/thmb/UoylMLyzOBPdDp34ForEiJd9m3s=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-522478216-5ab12c4e3de4230036949cee.jpg",
    desc:"900km network of lagoons, lakes, rivers and canals through lush coconut groves", tags:["Nature", "Houseboat", "Scenic"], color:"#10b981" },
  { id:"p8", name:"Hampi Ruins", city:"Hampi", state:"Karnataka", region:"South", category:"Monument", visitors:"500k+/yr",
    img:"https://www.holidaymonk.com/wp-content/uploads/2020/10/Vastuchitra_Stone-Chariot-Hampi.jpg",
    desc:"Surreal boulder-strewn landscape dotted with magnificent Vijayanagara ruins", tags:["UNESCO", "Ruins", "Trekking"], color:"#d97706" },
  { id:"p9", name:"Meenakshi Temple", city:"Madurai", state:"Tamil Nadu", region:"South", category:"Temple", visitors:"15k+/day",
    img:"https://thrillingtravel.in/wp-content/uploads/2018/02/Golden-Lotus-Pond-at-Meenakshi-Temple.jpg",
    desc:"14 towering gopurams adorned with thousands of colourful sculpted figures", tags:["Temple", "Architecture", "Culture"], color:"#ec4899" },
  { id:"p10", name:"Mysore Palace", city:"Mysore", state:"Karnataka", region:"South", category:"Palace", visitors:"6M+/yr",
    img:"https://karnatakatourism.org/_next/image/?url=https%3A%2F%2Fweb-cms.karnatakatourism.org%2Fwp-content%2Fuploads%2F2025%2F06%2FMysuru-Palace-banner-1920_1100.jpg&w=3840&q=75",
    desc:"Opulent Indo-Saracenic palace illuminated by 97,000 bulbs on Sundays", tags:["Palace", "Heritage", "Night View"], color:"#7c3aed" },
  { id:"p11", name:"Munnar Tea Hills", city:"Munnar", state:"Kerala", region:"South", category:"Nature", visitors:"800k+/yr",
    img:"https://www.civitatis.com/f/india/munnar/senderismo-letchmi-plantaciones-te-munnar-589x392.jpg",
    desc:"Rolling emerald hills blanketed by tea estates at 1,600m in the Western Ghats", tags:["Nature", "Tea", "Trekking"], color:"#059669" },
  { id:"p12", name:"Coorg Coffee Estates", city:"Madikeri", state:"Karnataka", region:"South", category:"Nature", visitors:"600k+/yr",
    img:"https://www.tataneu.com/pages/travel/_next/image?url=https%3A%2F%2Fd1msew97rp2nin.cloudfront.net%2Fprodin%2Ftntravel%2Fblogimages%2Fexpert-insights-on-coorg-coffee-plantation-stays-a57b67af-d2fc-4e25-8204-41a37a109ac1.webp&w=3840&q=75",
    desc:"Scotland of India — misty hills draped with coffee, pepper and cardamom plantations", tags:["Nature", "Coffee", "Waterfalls"], color:"#78716c" },
  { id:"p13", name:"Darjeeling Tea Gardens", city:"Darjeeling", state:"West Bengal", region:"East", category:"Nature", visitors:"400k+/yr",
    img:"https://3.imimg.com/data3/EF/FQ/MY-3370654/tea-gardens-of-darjeeling-the-hidden-paradise-500x500.jpg",
    desc:"Terraced tea gardens with panoramic views of Kanchenjunga, world's 3rd highest peak", tags:["Tea", "Mountains", "Heritage"], color:"#84cc16" },
  { id:"p14", name:"Sundarbans Mangroves", city:"South 24 Parganas", state:"West Bengal", region:"East", category:"Wildlife", visitors:"200k+/yr",
    img:"https://www.travelchhutichhuti.com/blog/wp-content/uploads/2020/11/Sundarban-National-Park.jpg",
    desc:"World's largest mangrove delta — home to the Royal Bengal Tiger", tags:["UNESCO", "Wildlife", "Tiger Reserve"], color:"#16a34a" },
  { id:"p15", name:"Konark Sun Temple", city:"Konark", state:"Odisha", region:"East", category:"Monument", visitors:"1M+/yr",
    img:"https://tds.indianeagle.com/wp-content/uploads/2026/02/Konark-temple.png",
    desc:"13th-century stone chariot-shaped temple dedicated to Surya, the Sun God", tags:["UNESCO", "Temple", "Sculpture"], color:"#ca8a04" },
  { id:"p16", name:"Goa Beaches", city:"Goa", state:"Goa", region:"West", category:"Beach", visitors:"8M+/yr",
    img:"https://s3.india.com/wp-content/uploads/2024/06/List-of-8-Famous-Beaches-Around-Goa.jpg?impolicy=Medium_Widthonly&w=350&h=263",
    desc:"Golden sands, turquoise waters, sea-food shacks and vibrant nightlife on both coasts", tags:["Beach", "Party", "Seafood"], color:"#0ea5e9" },
  { id:"p17", name:"Ajanta & Ellora Caves", city:"Aurangabad", state:"Maharashtra", region:"West", category:"Monument", visitors:"1M+/yr",
    img:"https://www.noblehousetours.com/wp-content/uploads/2025/04/How-To-Visit-The-Ajanta-And-Ellora-Caves-From-Aurangabad-%E2%80%93-Complete-Guide-1.jpg",
    desc:"Rock-cut Buddhist, Hindu and Jain cave complexes with 2,000-year-old frescoes", tags:["UNESCO", "Caves", "Art"], color:"#a16207" },
  { id:"p18", name:"Rann of Kutch", city:"Bhuj", state:"Gujarat", region:"West", category:"Nature", visitors:"300k+/yr",
    img:"https://www.tripsavvy.com/thmb/Yh7C0nh6CKbB5BmhRz3il-V8sm8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-537000923-541774dbe2d44759815fdf0719b04685.jpg",
    desc:"World's largest salt desert glowing white under the full moon sky", tags:["Desert", "Festival", "Unique"], color:"#e2e8f0" },
  { id:"p19", name:"Kaziranga Rhinos", city:"Kaziranga", state:"Assam", region:"Northeast", category:"Wildlife", visitors:"150k+/yr",
    img:"https://liamtra.com/blog/wp-content/uploads/2023/02/Untitled-design.png",
    desc:"UNESCO World Heritage Site — home to 2/3 of the world's one-horned rhinoceroses", tags:["UNESCO", "Wildlife", "Safari"], color:"#4ade80" },
  { id:"p20", name:"Cherrapunji Living Roots", city:"Cherrapunji", state:"Meghalaya", region:"Northeast", category:"Nature", visitors:"100k+/yr",
    img:"https://s7ap1.scene7.com/is/image/incredibleindia/double-decker-living-root-bridge-cherrapunjee-meghalaya-1-blog-adv-exp-cit-pop?qlt=82&ts=1742165770873",
    desc:"Bio-engineered living root bridges grown over 500 years by the Khasi people", tags:["Nature", "Unique", "Trekking"], color:"#22c55e" },
  { id:"p21", name:"Rohtang Pass", city:"Manali", state:"Himachal Pradesh", region:"Mountains", category:"Nature", visitors:"500k+/yr",
    img:"https://s7ap1.scene7.com/is/image/incredibleindia/rohtang-pass-manali-himachal-pradesh-1-attr-hero?qlt=82&ts=1726730701545",
    desc:"High mountain pass at 3,978m with sweeping snow views and the Lahaul-Spiti gateway", tags:["Snow", "Adventure", "Scenic"], color:"#bfdbfe" },
  { id:"p22", name:"Valley of Flowers", city:"Chamoli", state:"Uttarakhand", region:"Mountains", category:"Nature", visitors:"50k+/yr",
    img:"https://www.trekupindia.com/wp-content/uploads/2024/05/uttrakhand-valley-of-flowers-trek-1024x576.webp",
    desc:"UNESCO biosphere reserve — a Himalayan valley bursting with 300+ species of wildflowers", tags:["UNESCO", "Flowers", "Trek"], color:"#f9a8d4" },
  { id:"p23", name:"Leh Ladakh", city:"Leh", state:"Ladakh", region:"Mountains", category:"Nature", visitors:"400k+/yr",
    img:"https://www.lehladakhindia.com/wp-content/uploads/2024/07/leh-ladakh-india-slider-4.jpg",
    desc:"Moonscape high-altitude desert with ancient monasteries, pangong lake and starlit skies", tags:["Mountains", "Monasteries", "Biking"], color:"#60a5fa" },
  { id:"p24", name:"Rishikesh Ghats", city:"Rishikesh", state:"Uttarakhand", region:"Mountains", category:"Spiritual", visitors:"2M+/yr",
    img:"https://rishikeshdaytour.com/blog/wp-content/uploads/2022/10/Tirambakeshwar-Temple-Sai-Ghat-Rishikish.jpg",
    desc:"Yoga capital of the world — sacred ghats, ashrams, adventure sports and Ganga Aarti", tags:["Yoga", "Adventure", "Spiritual"], color:"#fb923c" }
];

const REGIONS = ["All","North","South","East","West","Northeast","Mountains"];
const CATEGORIES = ["All","Monument","Fort","Palace","Temple","Spiritual","Nature","Beach","Wildlife"];

/* =============================================
   DESTINATIONS (for stays)
============================================= */
const DESTINATIONS = [
  { name:"Goa", state:"Goa", tag:"Beaches & Nightlife",
    img:"https://picsum.photos/seed/goa2024/600/400",
    listings:124, emoji:"🏖️" },
  { name:"Jaipur", state:"Rajasthan", tag:"Royal Heritage",
    img:"https://picsum.photos/seed/jaipur2024/600/400",
    listings:98, emoji:"🏰" },
  { name:"Manali", state:"Himachal Pradesh", tag:"Mountain Escape",
    img:"https://picsum.photos/seed/manali2024/600/400",
    listings:76, emoji:"🏔️" },
  { name:"Kerala", state:"Kerala", tag:"Backwaters & Spice",
    img:"https://picsum.photos/seed/kerala2024/600/400",
    listings:112, emoji:"🌿" },
  { name:"Agra", state:"Uttar Pradesh", tag:"Taj Mahal & Mughal Art",
    img:"https://picsum.photos/seed/agra2024/600/400",
    listings:54, emoji:"🕌" },
  { name:"Varanasi", state:"Uttar Pradesh", tag:"Spiritual Capital",
    img:"https://picsum.photos/seed/varanasi2024/600/400",
    listings:43, emoji:"🪔" },
  { name:"Shimla", state:"Himachal Pradesh", tag:"Colonial Hill Station",
    img:"https://picsum.photos/seed/shimla2024/600/400",
    listings:61, emoji:"🌨️" },
  { name:"Mumbai", state:"Maharashtra", tag:"City of Dreams",
    img:"https://picsum.photos/seed/mumbai2024/600/400",
    listings:187, emoji:"🌆" },
  { name:"Udaipur", state:"Rajasthan", tag:"City of Lakes",
    img:"https://picsum.photos/seed/udaipur2024/600/400",
    listings:67, emoji:"🏯" },
  { name:"Darjeeling", state:"West Bengal", tag:"Tea Gardens",
    img:"https://picsum.photos/seed/darj2024/600/400",
    listings:38, emoji:"☕" },
  { name:"Rishikesh", state:"Uttarakhand", tag:"Yoga & Adventure",
    img:"https://picsum.photos/seed/rishi2024/600/400",
    listings:52, emoji:"🧘" },
  { name:"Coorg", state:"Karnataka", tag:"Coffee Estates",
    img:"https://picsum.photos/seed/coorg2024/600/400",
    listings:45, emoji:"☕" },
];

const LISTINGS = [
  { _id:"1", title:"Beachfront Infinity Pool Villa", location:"Calangute, Goa", dest:"Goa", lat:15.5449, lng:73.7517, price:8500, rating:4.96, reviews:214, type:"Villa",
    images:[
      "https://q-xx.bstatic.com/xdata/images/hotel/max1024x768/272858488.jpg?k=64658adfcb3e7bf1b02b14443d7a1e616e258163df29de5deee8783f42ed304c&o=",
      "https://www.angsana.com/_next/image?url=https%3A%2F%2Fwww.angsana.com%2Fassets%2F2021-11%2Fbeachfront-infinity-1.jpg&w=3840&q=75",
      "https://www.angsana.com/assets/2022-02/an-velavaru-infinity-pool-villa-interior.jpg",
      "https://pix10.agoda.net/hotelImages/22589369/0/1ee83a8a4ef83c2cb0cf286cd5207680.jpg?ca=17&ce=1&s=414x232&ar=16x9",
      "https://www.angsana.com/assets/2022-02/an-velavaru-infinity-pool-villa.jpg",
      "https://www.angsana.com/assets/2022-02/an-velavaru-floating-breakfast.jpg",
      "https://www.utours.am/webroot/myfiles/images/hotels/maldives/Angsana%20Velavaru/Beachfront%20Infinity%20Pool%20Villa/11.jpg"
    ], amenities:["WiFi", "Pool", "AC", "Kitchen", "Parking", "Beach Access"], maxGuests:8, bedrooms:4, bathrooms:3, host:{name:"Priya Sharma",avatar:"https://randomuser.me/api/portraits/women/44.jpg",joined:"2019",superhost:true}, description:"Wake up to the sound of waves at this stunning beachfront villa. Private infinity pool overlooking the Arabian Sea, lush garden leading directly to Calangute beach.", nearby:["Calangute Beach (50m)", "Beach Shacks (200m)", "Candolim (2km)"] },
  { _id:"2", title:"Royal Haveli Suite — Old City", location:"Jaipur, Rajasthan", dest:"Jaipur", lat:26.9124, lng:75.7873, price:6200, rating:4.88, reviews:156, type:"Heritage",
    images:[
      "https://media.indulgexpress.com/indulgexpress%2Fimport%2F2023%2F8%2F24%2Foriginal%2FTheRoyalHeritageHaveliJaipur.png?w=480&auto=format%2Ccompress&fit=max",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/cb/bb/af/royal-heritage-haveli.jpg?w=700&h=-1&s=1",
      "https://q-xx.bstatic.com/xdata/images/hotel/max500/607388776.jpg?k=dfad26df339f4b4b8d9a2c2f2ce26db919bd6fada41e0bbb3cb01dd27f46ef70&o=",
      "https://images.trvl-media.com/lodging/12000000/11110000/11103700/11103647/fabf4ac9.jpg?impolicy=resizecrop&rw=575&rh=575&ra=fill",
      "https://q-xx.bstatic.com/xdata/images/hotel/max500/607386228.jpg?k=c95997021d408daa0d2130dddfb8b430edc844ddd4fdb1f62db691cabb938f70&o=",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzCsb5dMIMSq--VQjTjWh82sp-rIvtB5JiOg&s"
    ], amenities:["WiFi", "Breakfast", "AC", "Rooftop", "Parking", "Heritage Tour"], maxGuests:4, bedrooms:2, bathrooms:2, host:{name:"Rajveer Singh",avatar:"https://randomuser.me/api/portraits/men/32.jpg",joined:"2018",superhost:true}, description:"Step into 300 years of Rajputana grandeur. Original frescoes, carved stone jalis, private rooftop with views of Nahargarh Fort.", nearby:["Hawa Mahal (800m)", "City Palace (1.2km)", "Johari Bazaar (500m)"] },
  { _id:"3", title:"Himalayan Pine Forest Cabin", location:"Old Manali, HP", dest:"Manali", lat:32.2396, lng:77.1887, price:3800, rating:4.92, reviews:98, type:"Cabin",
    images:[
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzt5IRDn7zqZOuc3cMsFRzbHCwrZf1tBfJ7w&s",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvwn2Y8KYAvqM-V6I9QkkVvu4d-8ulXvS-Rw&s",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1316413277822512898/original/95a43e61-e64f-47d1-a1b2-5c891a02841b.jpeg?im_w=720",
      "https://assets.cntraveller.in/photos/67405175112dc93621a0950f/16:9/w_2560,h_1440,c_limit/Himalayan%20Writers%20Retreat.jpg",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1440727326462760111/original/4c19a859-3f45-4dc0-97e5-bf835b740c97.jpeg",
      "https://picsum.photos/seed/07fb3b4ae5f1/1200/800",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsae8WDhtbT3zN3ROvs2M9CzphbZ0UXieUUw&s"
    ], amenities:["WiFi", "Fireplace", "Kitchen", "Balcony", "Heating", "Trekking Maps"], maxGuests:6, bedrooms:3, bathrooms:2, host:{name:"Arun Thakur",avatar:"https://randomuser.me/api/portraits/men/55.jpg",joined:"2020",superhost:false}, description:"Tucked among ancient deodar cedars at 2,050m altitude. Panoramic Himalayan views, wood-burning fireplace, handwoven Kullu shawl throws.", nearby:["Hadimba Temple (1km)", "Manu Temple (500m)", "Old Manali Market (200m)"] },
  { _id:"4", title:"Luxury Kerala Backwater Houseboat", location:"Alleppey, Kerala", dest:"Kerala", lat:9.4981, lng:76.3388, price:12000, rating:5, reviews:67, type:"Houseboat",
    images:[
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/06/e7/89/dd.jpg",
      "https://bluejellycruises.com/wp-content/uploads/2024/04/home-overview-img-2-1.webp",
      "https://southernpanoramacruise.com/wp-content/uploads/2023/02/houseboat-lobby.jpg",
      "https://7wayfinders.com/wp-content/uploads/2024/09/IMG_6851-scaled-1.jpg",
      "https://www.exoticahouseboatcruises.com/blogimg/exotica-blog.png"
    ], amenities:["AC", "Chef", "Boat Tour", "Fishing", "Breakfast", "Sunset Cruise"], maxGuests:6, bedrooms:3, bathrooms:3, host:{name:"George Varghese",avatar:"https://randomuser.me/api/portraits/men/72.jpg",joined:"2017",superhost:true}, description:"Drift through emerald waterways of Kerala on this premium all-teak houseboat. Personal chef, authentic seafood, sunset cruise included.", nearby:["Alleppey Beach (4km)", "Krishnapuram Palace (15km)", "Marari Beach (10km)"] },
  { _id:"5", title:"Taj-View Heritage Bungalow", location:"Agra, Uttar Pradesh", dest:"Agra", lat:27.1767, lng:78.0081, price:5500, rating:4.85, reviews:132, type:"Heritage",
    images:[
      "https://pix10.agoda.net/hotelImages/5074369/0/f163f5f88ed0c65afeab681e49187dc5.jpeg?ce=0&s=414x232",
      "https://images.trvl-media.com/lodging/1000000/530000/526400/526330/14985b11.jpg?impolicy=resizecrop&rw=575&rh=575&ra=fill",
      "https://cdn.sanity.io/images/ocl5w36p/prod5/70a8a581d4e90af149490877409077153b7ec46b-5160x3439.jpg?w=480&auto=format&dpr=2",
      "https://d1tm14lrsghf7q.cloudfront.net/public/media/184902/conversions/3_Sealounge-3-(1)-cover.jpg",
      "https://pix10.agoda.net/hotelImages/5074369/0/0f02e7a138e19228bf6ef49d37d0c0a6.jpeg?ce=0&s=414x232"
    ], amenities:["WiFi", "AC", "Breakfast", "Rooftop", "Garden", "Heritage Tour"], maxGuests:4, bedrooms:2, bathrooms:2, host:{name:"Ananya Gupta",avatar:"https://randomuser.me/api/portraits/women/34.jpg",joined:"2019",superhost:true}, description:"Wake up to a postcard view of the Taj Mahal. This 150-year-old Mughal-era bungalow blends history with modern comfort.", nearby:["Taj Mahal (800m)", "Agra Fort (3km)", "Mehtab Bagh (5km)"] },
  { _id:"6", title:"Sacred Ganges Ghat Apartment", location:"Assi Ghat, Varanasi", dest:"Varanasi", lat:25.2677, lng:82.999, price:2800, rating:4.78, reviews:89, type:"Apartment",
    images:[
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg0QKgDRmxPYsMNfr8WQJjwkTj21KTEwA7Vg&s",
      "https://images.timesnownews.com/thumb/msid-115648105,thumbsize-67372,width-400,height-225,resizemode-75/115648105.jpg",
      "https://gos3.ibcdn.com/6581d7b2-cd2a-4ee5-bc56-d2bc09620d59.jpeg",
      "https://orchardamritaya.oswalgroup.net/images/whychoos-banner-3.jpg",
      "https://i.ytimg.com/vi/Ak8DFG-l1uo/maxresdefault.jpg"
    ], amenities:["WiFi", "AC", "Yoga Class", "Ghat Access", "Breakfast", "Boat Ride"], maxGuests:3, bedrooms:1, bathrooms:1, host:{name:"Pandit Sharma",avatar:"https://randomuser.me/api/portraits/men/63.jpg",joined:"2018",superhost:false}, description:"A serene apartment steps from the sacred Assi Ghat. Watch the Ganga Aarti from your balcony, take boat rides at sunrise.", nearby:["Assi Ghat (100m)", "BHU Campus (1km)", "Vishwanath Temple (3km)"] },
  { _id:"7", title:"Colonial Hillside Cottage", location:"Shimla, Himachal Pradesh", dest:"Shimla", lat:31.1048, lng:77.1734, price:4200, rating:4.82, reviews:104, type:"Cabin",
    images:[
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/a836edc5-9220-4e91-a769-e855e4d77be3.jpeg?im_w=960",
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/f1f152ae-4684-4713-8a73-29b4836baebf.jpeg?im_w=720",
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/d8bcd26a-93a1-4a3a-85a9-ee77a838d1d1.jpeg?im_w=720",
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/0da6218d-f0cf-4a30-b1c0-aae9ea894d59.jpeg?im_w=720",
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/0bfa993b-fd0c-4e66-be9c-4c18be69023a.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/0da6218d-f0cf-4a30-b1c0-aae9ea894d59.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/a07498c0-841e-4641-8393-8f41748a938c.jpeg?im_w=1920",
      "https://a0.muscache.com/im/pictures/miso/Hosting-48854818/original/4ef331e0-d66f-4362-a354-87085eaca708.jpeg?im_w=1920"
    ], amenities:["WiFi", "Fireplace", "Kitchen", "Mountain View", "Heating", "Parking"], maxGuests:5, bedrooms:2, bathrooms:2, host:{name:"Neha Kapoor",avatar:"https://randomuser.me/api/portraits/women/61.jpg",joined:"2020",superhost:true}, description:"A charming British-era cottage on Shimla's pine-covered slopes with sweeping valley views. Stone fireplace, bay windows, colonial furniture.", nearby:["The Ridge (1.5km)", "Mall Road (1km)", "Jakhu Temple (3km)"] },
  { _id:"8", title:"Sky-High Bandra Apartment", location:"Bandra West, Mumbai", dest:"Mumbai", lat:19.0596, lng:72.8295, price:9500, rating:4.75, reviews:312, type:"Apartment",
    images:[
      "https://keystonerealestateadvisory.com/public/uploads/property/QiGfBxUbOTR8nLxO63Jn4jbhPkMZoA49FffhXjDH.webp",
      "https://s3.ap-south-1.amazonaws.com/prophunt.prod.fs/projects/6899b53c7e3cd4b8d5ab694f/images/coverImage/0.webp",
      "https://www.sarthakestates.com/wp-content/uploads/2026/01/3-4-BHK-Apartments-Sky-Mansions.jpg",
      "https://img.staticmb.com/mbphoto/property/cropped_images/2026/Mar/14/Photo_h470_w1080/83773045_9_eck1_470_1080.jpg",
      "https://picsum.photos/seed/a197022b5858/1200/800",
      "https://vital-space-media.s3.ap-south-1.amazonaws.com/project_gallery/webthumb/projectGallery-257120-26-05-2024.webp",
      "https://vitalspace.in/_next/image?url=https%3A%2F%2Fvital-space-media.s3.ap-south-1.amazonaws.com%2Fproject_gallery%2Fwebthumb%2FprojectGallery-616972-29-05-2024.webp&w=1080&q=75"
    ], amenities:["WiFi", "Gym", "AC", "Sea View", "Concierge", "Workspace"], maxGuests:4, bedrooms:2, bathrooms:2, host:{name:"Sneha Kapoor",avatar:"https://randomuser.me/api/portraits/women/67.jpg",joined:"2021",superhost:true}, description:"28th-floor apartment in Mumbai's trendiest neighbourhood with jaw-dropping Arabian Sea views. Floor-to-ceiling windows, chef's kitchen.", nearby:["Bandstand Promenade (300m)", "Linking Road (600m)", "Mount Mary Church (800m)"] },
  { _id:"9", title:"Lake Palace View Boutique Room", location:"Udaipur, Rajasthan", dest:"Udaipur", lat:24.5854, lng:73.7125, price:7800, rating:4.93, reviews:178, type:"Heritage",
    images:[
      "https://gos3.ibcdn.com/eb65e940-5f99-4e6c-88f1-56dcb82a9e26.jpg",
      "https://mewar-villas.hotels-rajasthan.com/data/Pics/OriginalPhoto/13982/1398280/1398280190/hide-in-udaipur-a-lake-view-boutique-hotel-udaipur-pic-8.JPEG",
      "https://www.theleela.com/prod/content/assets/aio-banner/dekstop/GH%20Lake%20View%20Room%20wt%20Balcony_1920x950.webp?VersionId=p3Aw8zZco5aRNhCWbdgchiyzPXmJ1vLw",
      "https://c8.alamy.com/comp/W2C3RX/india-rajasthan-udaipur-rooftop-restaurant-of-boutique-hotel-with-view-lake-pichola-W2C3RX.jpg",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/20/5a/e8/sarva-ritu-agrand-royal.jpg?w=700&h=-1&s=1"
    ], amenities:["WiFi", "Breakfast", "AC", "Lake View", "Rooftop", "Boat Ride"], maxGuests:2, bedrooms:1, bathrooms:1, host:{name:"Maharani Devi",avatar:"https://randomuser.me/api/portraits/women/48.jpg",joined:"2017",superhost:true}, description:"A hand-painted haveli room with direct views of Lake Pichola and the Lake Palace. Traditional folk music at sunset from rooftop.", nearby:["Lake Pichola (direct)", "City Palace (800m)", "Jagdish Temple (1km)"] },
  { _id:"10", title:"Tea Garden Bungalow", location:"Darjeeling, West Bengal", dest:"Darjeeling", lat:27.036, lng:88.2627, price:4600, rating:4.87, reviews:93, type:"Villa",
    images:[
      "https://wbtourismdotblog.wordpress.com/wp-content/uploads/2021/08/carron-0001.jpg",
      "https://www.theweek.in/content/dam/week/magazine/the-week/leisure/2016/january/images/52TalayarValleyBungalow.jpg",
      "https://assets.cntraveller.in/photos/65f855d04aed9fe00560180f/1:1/w_750,h_750,c_limit/talayarvalley.jpg",
      "https://www.nomadicweekends.com/wp-content/uploads/2020/03/balcony.png",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/67/fe/01/view-from-garden.jpg?w=900&h=-1&s=1",
      "https://heritagebungalows.com/wp-content/uploads/2013/07/temi-dak-bungalow1.jpg"
    ], amenities:["WiFi", "Breakfast", "Fireplace", "Tea Tour", "Mountain View", "Garden"], maxGuests:4, bedrooms:2, bathrooms:2, host:{name:"Tenzin Dorje",avatar:"https://randomuser.me/api/portraits/men/41.jpg",joined:"2019",superhost:true}, description:"A colonial planter's bungalow surrounded by rows of tea. Watch Kanchenjunga at sunrise, take guided tea garden walks, sip first-flush Darjeeling.", nearby:["Tiger Hill (11km)", "Batasia Loop (5km)", "Peace Pagoda (3km)"] },
  { _id:"11", title:"Ganga-View Yoga Retreat", location:"Tapovan, Rishikesh", dest:"Rishikesh", lat:30.1087, lng:78.319, price:3200, rating:4.89, reviews:147, type:"Treehouse",
    images:[
      "https://www.gangakinare.com/yoga-meditation-retreats/wp-content/themes/gangakinare-yoga/assets/img/one-ness.webp",
      "https://www.gangakinare.com/yoga-meditation-retreats/wp-content/themes/gangakinare-yoga/assets/img/experiences/dedicated-yoga_halls-4.jpg",
      "https://www.gangakinare.com/yoga-meditation-retreats/wp-content/themes/gangakinare-yoga/assets/img/experiences/spiritual-walks-1.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROpJxIsg9ErHyL_X0IQ1HyrusHGYIZHHcRYg&s"
    ], amenities:["WiFi", "Yoga Class", "Meditation", "River View", "Breakfast", "Ayurveda"], maxGuests:3, bedrooms:1, bathrooms:1, host:{name:"Swami Prakash",avatar:"https://randomuser.me/api/portraits/men/29.jpg",joined:"2018",superhost:false}, description:"A riverside retreat in the yoga capital of the world. Morning yoga classes, Ganga Aarti ceremonies, white-water rafting nearby.", nearby:["Laxman Jhula (500m)", "Ram Jhula (2km)", "Beatles Ashram (4km)"] },
  { _id:"12", title:"Coorg Coffee Plantation Bungalow", location:"Madikeri, Coorg", dest:"Coorg", lat:12.4244, lng:75.7382, price:7200, rating:4.84, reviews:89, type:"Villa",
    images:[
      "https://a0.muscache.com/im/pictures/d302bc93-e553-4cfb-acbd-22f6e3cbc918.jpg",
      "https://assets.cntraveller.in/photos/686f93e43d1746ee8e68b9a4/16:9/w_1024%2Cc_limit/WhatsApp%2520Image%25202025-07-05%2520at%252019.01.02.jpeg",
      "https://assets.cntraveller.in/photos/682ab467c899e6e45e130f8d/master/w_1024%2Cc_limit/Dhanagiri9.jpg",
      "https://cdn.sanity.io/images/ocl5w36p/prod5/f6573d582607ba89c03bd18e148328d40804cad7-4774x3534.jpg?w=480&auto=format&dpr=2",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/a7/8d/93/woshully-bungalow.jpg?w=900&h=500&s=1"
    ], amenities:["WiFi", "Pool", "Breakfast", "Coffee Tour", "Kitchen", "Garden"], maxGuests:6, bedrooms:3, bathrooms:2, host:{name:"Kavitha Nair",avatar:"https://randomuser.me/api/portraits/women/52.jpg",joined:"2019",superhost:true}, description:"Colonial planter's bungalow set amidst 40 acres of working coffee and pepper estate in the Western Ghats.", nearby:["Abbey Falls (10km)", "Raja's Seat (5km)", "Dubare Elephant Camp (30km)"] },
  { _id:"13", title:"Golden Dunes Desert Glamping", location:"Sam Sand Dunes, Jaisalmer", dest:"Jaipur", lat:26.8887, lng:70.5833, price:4500, rating:4.91, reviews:143, type:"Tent",
    images:[
      "https://media.cntraveller.in/wp-content/uploads/amp-stories/tomorrowlands-dubai-resort-brings-pool-parties-to-the-desert/assets/6.jpeg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuc4ef0EvpSmJ-Gb4Tm96OtJAhXXSP8szI3A&s",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBOEW-Dj1SiH9n5OF2N02AxUB8H0KUferQYA&s",
      "https://media.easemytrip.com/media/Blog/India/638792747923726867/638792747923726867Br5l1H.png",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXVEGM-Rksw83SToJFPAz6WG1cOf-LR_srQw&s"
    ], amenities:["AC", "Camel Safari", "Bonfire", "Stargazing", "Dinner", "Folk Music"], maxGuests:2, bedrooms:1, bathrooms:1, host:{name:"Fatima Begum",avatar:"https://randomuser.me/api/portraits/women/29.jpg",joined:"2020",superhost:false}, description:"Sleep under a billion stars in the Thar Desert. Luxury Swiss tent, camel safari at sunrise, thali dinner, folk music included.", nearby:["Sam Sand Dunes (200m)", "Jaisalmer Fort (42km)", "Gadisar Lake (43km)"] },
  { _id:"14", title:"Andaman Overwater Beach Cottage", location:"Havelock Island, Andaman", dest:"Goa", lat:11.976, lng:92.9972, price:11500, rating:4.97, reviews:78, type:"Villa",
    images:[
      "https://www.andamanworldtravels.com/images-new/blog-25/planning-your-gateway-exploring-water-villas-in-andaman.webp",
      "https://www.holidify.com/images/cmsuploads/compressed/1-89-750x375_20191216182335.jpg",
      "https://andamanlove.com/wp-content/uploads/2024/11/Untitled-design-11.webp",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPutBixJNZcAvF9hFjwBSu-qbzRlCZ08MJFg&s",
      "https://takeatripindiakolkata.wordpress.com/wp-content/uploads/2025/01/comparison-of-offbeat-attractions-andaman-tour-package-from-kolkata-maldives-vs-andaman-1.jpg?w=1024",
      "https://www.tataneu.com/pages/travel/_next/image?url=https%3A%2F%2Fd1msew97rp2nin.cloudfront.net%2Fprodin%2Ftntravel%2Fblogimages%2FUntitled%20design(46)-d11b9a38-30bf-4820-9286-f62c4c0e8dfa.webp&w=3840&q=75",
      "https://www.capertravelindia.com/images/andaman-3.jpg"
    ], amenities:["AC", "Snorkeling", "Kayak", "Beach Access", "Breakfast", "Sunset Deck"], maxGuests:2, bedrooms:1, bathrooms:1, host:{name:"Coral Bay Resorts",avatar:"https://randomuser.me/api/portraits/women/56.jpg",joined:"2016",superhost:true}, description:"Stilted over crystal-clear turquoise water on Radhanagar Beach — Asia's finest. Coral reefs directly below, snorkelling gear included.", nearby:["Radhanagar Beach (direct)", "Elephant Beach (8km)", "Neil Island (40km)"] },
  { _id:"15", title:"Old Quarter Riad-Style Haveli", location:"Jodhpur, Rajasthan", dest:"Jaipur", lat:26.2389, lng:73.0243, price:5100, rating:4.86, reviews:134, type:"Heritage",
    images:[
      "https://media.istockphoto.com/id/2051324257/photo/scenic-aerial-view-of-an-old-palace-in-mandawa-now-serving-as-luxury-hotel-mandawa.jpg?s=612x612&w=0&k=20&c=7IsCO5AStKvopORK4RhJMqmiwRJndEUJqkU2pZ6xHYQ=",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/30/59/81/b8/courtyard.jpg?w=900&h=500&s=1",
      "https://akm-img-a-in.tosshub.com/indiatoday/styles/medium_crop_simple/public/2023-09/kathika-3.jpg?VersionId=jtaj3UvZs6yNKGhosOyUFjELa1Hodbi7&size=750:*",
      "https://www.decorpot.com/images/blogimage1258396763elaborate-courtyards.jpg",
      "https://assets.cntraveller.in/photos/696e03b93b394e9a27c3be08/master/w_1600%2Cc_limit/Copy%2520of%2520PGB07880.JPG"
    ], amenities:["WiFi", "Breakfast", "AC", "Rooftop", "Mehrangarh View", "Folk Music"], maxGuests:4, bedrooms:2, bathrooms:2, host:{name:"Veer Singh",avatar:"https://randomuser.me/api/portraits/men/46.jpg",joined:"2019",superhost:true}, description:"A blue-painted haveli in Jodhpur's Blue City with rooftop views of the mighty Mehrangarh Fort.", nearby:["Mehrangarh Fort (500m)", "Jaswant Thada (1km)", "Sardar Market (800m)"] },
  { _id:"16", title:"Munnar Tea Estate Treehouse", location:"Munnar, Kerala", dest:"Kerala", lat:10.0889, lng:77.0595, price:5800, rating:4.9, reviews:112, type:"Treehouse",
    images:[
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/06/f2/69/a9.jpg",
      "https://dreamcatchermunnar.com/wp-content/uploads/2025/01/treehouse-room.jpg",
      "https://naturezoneresortmunnar.com/wp-content/uploads/2023/03/tree4.webp",
      "https://keralatourpackagesguide.com/wp-content/uploads/2017/08/01.jpg",
      "https://a0.muscache.com/im/pictures/af9e6615-26f6-499e-8ac6-3668d1724788.jpg"
    ], amenities:["WiFi", "Breakfast", "Garden", "Tea Tour", "Hiking", "Sunrise View"], maxGuests:4, bedrooms:2, bathrooms:1, host:{name:"Rani Menon",avatar:"https://randomuser.me/api/portraits/women/73.jpg",joined:"2018",superhost:true}, description:"A wooden treehouse in a working tea estate at 1,600m. Wake to mist rising over endless green hills. Guided tea factory tours and elephant spotting.", nearby:["Eravikulam NP (15km)", "Mattupetty Dam (13km)", "Top Station (32km)"] }
];

/* =============================================
   LISTINGS STORE — host edits persist to localStorage
============================================= */
const LISTINGS_STORE = (() => {
  // Always start from hardcoded LISTINGS — host edits override on top via localStorage
  const loadData = () => {
    try {
      const saved = localStorage.getItem("staybnb_listings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedMap = new Map(parsed.map(l => [l._id, l]));
        // Only use saved data if it's for the same listing IDs (prevents stale data)
        const currentIds = new Set(LISTINGS.map(l => l._id));
        const validSaved = parsed.filter(l => currentIds.has(l._id));
        if (validSaved.length === LISTINGS.length) {
          return LISTINGS.map(l => savedMap.has(l._id) ? savedMap.get(l._id) : { ...l });
        }
        // If mismatch (fresh data hardcoded), clear old cache and use new
        localStorage.removeItem("staybnb_listings");
      }
    } catch(e) {}
    return LISTINGS.map(l => ({ ...l }));
  };

  const saveData = (data) => {
    try {
      localStorage.setItem("staybnb_listings", JSON.stringify(data));
    } catch(e) {}
  };

  return {
    _data: loadData(),
    _listeners: [],
    getAll() { return this._data; },
    update(updated) {
      const idx = this._data.findIndex(l => l._id === updated._id);
      if (idx > -1) {
        this._data[idx] = updated;
        saveData(this._data);
        console.log(`✅ Listing saved: "${updated.title}" | Images: ${updated.images?.length} | localStorage updated`);
        this._listeners.forEach(fn => fn([...this._data]));
      }
    },
    reset() {
      // Clear saved edits and reload originals
      try { localStorage.removeItem("staybnb_listings"); } catch(e) {}
      this._data = LISTINGS.map(l => ({ ...l }));
      this._listeners.forEach(fn => fn([...this._data]));
    },
    subscribe(fn) {
      this._listeners.push(fn);
      return () => { this._listeners = this._listeners.filter(l => l !== fn); };
    },
  };
})();

// eslint-disable-next-line no-unused-vars
const BOOKINGS_DATA = [
  { _id:"b1",listing:LISTINGS[0],checkIn:"2025-04-10",checkOut:"2025-04-14",guests:2,total:38080,status:"confirmed" },
  { _id:"b2",listing:LISTINGS[2],checkIn:"2025-05-01",checkOut:"2025-05-05",guests:2,total:17024,status:"pending" },
];

/* =============================================
   SHARED REAL-TIME BOOKINGS STORE
   When a customer books, it's saved here.
   Host can see all bookings with customer details.
============================================= */
const BOOKINGS_STORE = (() => {
  const LS_KEY = "staybnb_bookings";
  const readLS  = () => { try { const s=localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : []; } catch(e){ return []; } };
  const writeLS = (data) => { try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e){} };
  return {
    add(booking)   { const d=readLS(); d.unshift(booking); writeLS(d); },
    getAll()       { return readLS(); },
    getByEmail(email) { return readLS().filter(b=>b.customerEmail===email); },
    update(updated){ const d=readLS(); const i=d.findIndex(b=>b._id===updated._id); if(i>-1){d[i]=updated; writeLS(d);} },
    remove(id)     { const d=readLS().filter(b=>b._id!==id); writeLS(d); },
  };
})();
/* =============================================
   REVIEWS DATA
============================================= */
const REVIEWS_DATA = {
  "1": [
    { id:"r1", name:"Arjun Mehta", avatar:"https://randomuser.me/api/portraits/men/11.jpg", date:"March 2025", rating:5, text:"Absolutely stunning villa! The infinity pool with the Arabian Sea view at sunset was magical. Priya was incredibly responsive and even arranged a private beach bonfire for us. Will 100% return." },
    { id:"r2", name:"Shreya Iyer", avatar:"https://randomuser.me/api/portraits/women/22.jpg", date:"February 2025", rating:5, text:"Perfect Goa experience. The villa is exactly as pictured — lush garden, spotless interiors, and the beach is literally 50 steps away. Highly recommend the evening shack walks." },
    { id:"r3", name:"Rohan Verma", avatar:"https://randomuser.me/api/portraits/men/33.jpg", date:"January 2025", rating:4, text:"Great place for a group trip. Spacious, well-equipped kitchen, and super clean. Only minor thing — the WiFi drops occasionally. But the location more than makes up for it." },
    { id:"r4", name:"Divya Nair", avatar:"https://randomuser.me/api/portraits/women/44.jpg", date:"December 2024", rating:5, text:"Celebrated our anniversary here. Priya left a surprise flower arrangement and welcome drinks! The pool is pristine and the outdoor shower is a unique touch. Loved every moment." },
  ],
  "2": [
    { id:"r5", name:"Kavya Sharma", avatar:"https://randomuser.me/api/portraits/women/55.jpg", date:"March 2025", rating:5, text:"Rajveer is an exceptional host. The haveli is a living piece of history — original mirror work on the walls, rooftop with a direct view of Nahargarh. The heritage breakfast was incredible." },
    { id:"r6", name:"Nikhil Patel", avatar:"https://randomuser.me/api/portraits/men/66.jpg", date:"February 2025", rating:4, text:"Beautiful property. The rooftop at night with the illuminated city is unforgettable. Heritage tour arranged by the host was very informative. Only wish the AC was a bit stronger." },
    { id:"r7", name:"Anita Joshi", avatar:"https://randomuser.me/api/portraits/women/77.jpg", date:"January 2025", rating:5, text:"Felt like royalty! Every detail in this haveli is thoughtfully restored. Rajveer's knowledge of Jaipur history is incredible. The Rajasthani breakfast spread is worth visiting for alone." },
  ],
  "3": [
    { id:"r8", name:"Vikram Singh", avatar:"https://randomuser.me/api/portraits/men/88.jpg", date:"February 2025", rating:5, text:"Woke up at 5am to mist rolling through the pines from the balcony. The cabin is warm, cosy and perfectly stocked. Arun's trekking maps led us to a hidden waterfall. Magical." },
    { id:"r9", name:"Priya Kapoor", avatar:"https://randomuser.me/api/portraits/women/99.jpg", date:"January 2025", rating:5, text:"The fireplace, the snow outside, chai in hand — pure bliss. The cabin feels handcrafted with love. Hadimba temple walk at sunset is a must. Already planning next winter." },
  ],
  "4": [
    { id:"r10", name:"George Thomas", avatar:"https://randomuser.me/api/portraits/men/10.jpg", date:"March 2025", rating:5, text:"The houseboat exceeded every expectation. Chef prepared the most authentic Kerala prawn curry I've ever tasted. Watching the sunset over the backwaters with a toddy is a memory I'll carry forever." },
    { id:"r11", name:"Meera Krishnan", avatar:"https://randomuser.me/api/portraits/women/12.jpg", date:"February 2025", rating:5, text:"Five stars isn't enough. The teak boat is immaculately maintained. George arranged a dawn bird-watching canoe trip. The silence of the waterways at 6am is something you must experience." },
    { id:"r12", name:"Aditya Menon", avatar:"https://randomuser.me/api/portraits/men/14.jpg", date:"January 2025", rating:5, text:"Honeymooned here. The boat gliding through lotus-covered canals, traditional lamps lit at dusk, chef making us payasam — every detail was perfect. A once-in-a-lifetime experience." },
  ],
};
// Default reviews for listings without specific reviews
const DEFAULT_REVIEWS = [
  { id:"dr1", name:"Rahul Das", avatar:"https://randomuser.me/api/portraits/men/21.jpg", date:"March 2025", rating:5, text:"Exceptional stay. The host was super attentive and the property was spotless. Location is perfect — everything within easy reach. Would absolutely recommend to friends and family." },
  { id:"dr2", name:"Sunita Rao", avatar:"https://randomuser.me/api/portraits/women/31.jpg", date:"February 2025", rating:4, text:"Really enjoyed our stay here. Great value for the experience. The photos are accurate and the communication with the host was seamless. Will definitely consider returning." },
  { id:"dr3", name:"Amit Sharma", avatar:"https://randomuser.me/api/portraits/men/41.jpg", date:"January 2025", rating:5, text:"One of the best stays I've had in India. The attention to detail is remarkable — fresh flowers, local welcome snacks, detailed local guide. Felt truly at home." },
];

/* =============================================
   GLOBAL LIVE NOTIFICATIONS STORE
   Push here on booking — both customer & host get real-time alerts.
   Each notif: { id, icon, title, msg, time, read, for, booking?, customerInfo? }
============================================= */
const NOTIFS_STORE = {
  _data: [],
  _listeners: [],
  push(notif) {
    this._data.unshift({ ...notif, id:"n_"+Date.now()+Math.random(), time:"Just now", read:false });
    this._listeners.forEach(fn=>fn([...this._data]));
  },
  getFor(role, email) {
    if(role==="host") return this._data.filter(n=>n.for==="host");
    return this._data.filter(n=>n.for===email);
  },
  markRead(id) {
    const n=this._data.find(x=>x.id===id);
    if(n){ n.read=true; this._listeners.forEach(fn=>fn([...this._data])); }
  },
  markAllRead(role, email) {
    this.getFor(role,email).forEach(n=>{n.read=true;});
    this._listeners.forEach(fn=>fn([...this._data]));
  },
  subscribe(fn){ this._listeners.push(fn); return ()=>{this._listeners=this._listeners.filter(l=>l!==fn);}; },
  unreadCount(role,email){ return this.getFor(role,email).filter(n=>!n.read).length; },
};



const AICONS = { WiFi:"📶",Pool:"🏊",AC:"❄️",Kitchen:"🍳",Parking:"🚗",Breakfast:"🥐",Fireplace:"🔥",Balcony:"🏔️",Gym:"💪",Chef:"👨‍🍳",Fishing:"🎣",Bicycle:"🚲",Workspace:"💻",Garden:"🌿",Rooftop:"🌇","Beach Access":"🏖️","Boat Tour":"⛵","Camel Safari":"🐪",Stargazing:"🌟",Bonfire:"🔥","Folk Music":"🎵","Coffee Tour":"☕","Sunset Cruise":"🌅","Trekking Maps":"🗺️",Heating:"🌡️","Heritage Tour":"🏰","Sea View":"🌊",Dinner:"🍽️","Beach 200m":"🏖️",Terrace:"☀️","Yoga Class":"🧘",Meditation:"🪬","Boat Ride":"⛵","Ghat Access":"🪔",Ayurveda:"🌿","Tea Tour":"☕","Mountain View":"🏔️","Sunrise View":"🌅",Hiking:"🥾","Local Guide":"🧭",Snorkeling:"🤿",Kayak:"🛶","Sunset Deck":"🌅","Mehrangarh View":"🏯","Lake View":"🏞️","River View":"🌊","Concierge":"🛎️" };

const Ctx = createContext(null);
const useAuth = () => useContext(Ctx);

function useLeaflet() {
  const [ok, setOk] = useState(!!window.L);
  useEffect(() => {
    if (window.L) { setOk(true); return; }
    const css = Object.assign(document.createElement("link"),{rel:"stylesheet",href:"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"});
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => setOk(true);
    document.head.appendChild(s);
  }, []);
  return ok;
}

function MapView({ lat, lng, title, zoom=14, markers=[] }) {
  const uid = useRef("m"+Math.random().toString(36).slice(2));
  const inst = useRef(null);
  useEffect(() => {
    if (inst.current) return;
    const L = window.L;
    const map = L.map(uid.current,{scrollWheelZoom:false}).setView([lat,lng],zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap",maxZoom:19}).addTo(map);
    const mk = L.divIcon({className:"",iconAnchor:[18,38],html:`<div style="background:#FF385C;color:#fff;border-radius:50% 50% 50% 0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(255,56,92,.5);border:3px solid #fff"><span style="transform:rotate(45deg)">🏠</span></div>`});
    if (markers.length) { markers.forEach(m=>L.marker([m.lat,m.lng],{icon:mk}).addTo(map).bindPopup(`<b style="font-family:sans-serif">${m.title}</b><br><span style="color:#FF385C;font-family:sans-serif">Rs.${m.price?.toLocaleString()}/night</span>`)); }
    else { L.marker([lat,lng],{icon:mk}).addTo(map).bindPopup(`<b style="font-family:sans-serif">${title}</b>`).openPopup(); }
    inst.current = map;
    return () => { inst.current?.remove(); inst.current=null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div id={uid.current} style={{width:"100%",height:"100%"}} />;
}

/* =============================================
   STYLES
============================================= */
const S = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Sora',sans-serif;color:#1a1a1a;background:#fff;overflow-x:hidden;}
    :root{--red:#FF385C;--dark:#18181b;--gray:#6b7280;--lg:#e5e7eb;--bg:#f9fafb;--green:#059669;--sh:0 4px 24px rgba(0,0,0,.09);--sh2:0 12px 40px rgba(0,0,0,.15);}
    button,input,select,textarea{font-family:'Sora',sans-serif;}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;border-radius:12px;padding:13px 26px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
    .r{background:linear-gradient(135deg,#FF385C,#e0314f);color:#fff;}.r:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,56,92,.4);}
    .dk{background:var(--dark);color:#fff;}.dk:hover{background:#333;transform:translateY(-1px);}
    .gh{background:transparent;color:var(--dark);border:1.5px solid var(--lg);}.gh:hover{border-color:#9ca3af;background:var(--bg);}
    .card{background:#fff;border-radius:20px;overflow:hidden;transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s;cursor:pointer;}
    .card:hover{transform:translateY(-6px) scale(1.01);box-shadow:var(--sh2);}
    .badge{padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;}
    .bg{background:#d1fae5;color:#065f46;}.by{background:#fef3c7;color:#92400e;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
    @keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
    @keyframes lp{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.8);opacity:.3;}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}
    .fu{animation:fadeUp .4s ease both;}
    .s1{animation-delay:.04s;}.s2{animation-delay:.08s;}.s3{animation-delay:.12s;}.s4{animation-delay:.16s;}.s5{animation-delay:.2s;}.s6{animation-delay:.24s;}.s7{animation-delay:.28s;}.s8{animation-delay:.32s;}.s9{animation-delay:.36s;}.s10{animation-delay:.4s;}.s11{animation-delay:.44s;}.s12{animation-delay:.48s;}
    .sk{background:linear-gradient(90deg,#f3f4f6 25%,#e9eaeb 50%,#f3f4f6 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:14px;}
    .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green);animation:lp 1.8s infinite;}
    input:focus,select:focus,textarea:focus{outline:none;border-color:var(--dark)!important;}
    ::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px;}
    .pills{display:flex;gap:8px;overflow-x:auto;}.pills::-webkit-scrollbar{display:none;}
    .pill{flex-shrink:0;padding:8px 18px;border-radius:40px;border:1.5px solid var(--lg);background:#fff;font-weight:600;font-size:13px;cursor:pointer;transition:all .18s;white-space:nowrap;}
    .pill:hover{border-color:#9ca3af;}.pill.on{border-color:var(--dark)!important;background:var(--dark)!important;color:#fff!important;}
    .pgrid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;height:480px;border-radius:20px;overflow:hidden;}
    .pgrid .main{grid-row:1/3;overflow:hidden;}.pgrid .sub{overflow:hidden;position:relative;}
    .pgrid img{width:100%;height:100%;object-fit:cover;transition:transform .4s;}.pgrid img:hover{transform:scale(1.04);}
    table{width:100%;border-collapse:collapse;}
    thead th{padding:12px 18px;text-align:left;font-size:11px;font-weight:800;color:var(--gray);letter-spacing:.06em;background:var(--bg);text-transform:uppercase;}
    tbody td{padding:14px 18px;border-top:1px solid var(--lg);font-size:14px;}
    tbody tr{transition:background .15s;cursor:pointer;}tbody tr:hover td{background:var(--bg);}
    .heart{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.88);border:none;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;backdrop-filter:blur(6px);}
    .heart:hover{transform:scale(1.15);background:#fff;}
    .modal{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);}
    .mbox{background:#fff;border-radius:24px;max-width:820px;width:93%;max-height:90vh;overflow-y:auto;padding:36px;}
    .leaflet-container{z-index:1;}
    .mwrap{border-radius:18px;overflow:hidden;}
    .trow{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;}.trow::-webkit-scrollbar{display:none;}
    .chip{flex-shrink:0;display:flex;align-items:center;gap:8px;border:1.5px solid var(--lg);border-radius:40px;padding:8px 14px 8px 8px;background:#fff;cursor:pointer;transition:all .2s;font-size:13px;font-weight:600;}
    .chip:hover{border-color:var(--red);box-shadow:0 2px 12px rgba(255,56,92,.12);}
    .chip img{width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;}
    /* PLACES SECTION */
    .place-card{border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s;cursor:default;}
    .place-card:hover{transform:translateY(-8px);box-shadow:var(--sh2);}
    .place-card:hover .place-img{transform:scale(1.06);}
    .place-img{width:100%;height:200px;object-fit:cover;transition:transform .5s ease;display:block;}
    .place-tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:.04em;}
    .dc{border-radius:18px;overflow:hidden;cursor:pointer;transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s;position:relative;}
    .dc:hover{transform:translateY(-5px);box-shadow:var(--sh2);}.dc:hover img{transform:scale(1.08);}
    .dc img{transition:transform .5s ease;width:100%;height:100%;object-fit:cover;}
    /* region label */
    .region-label{display:inline-block;padding:3px 10px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;}
    /* mobile bottom nav */
    .mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--lg);z-index:300;padding:8px 0 env(safe-area-inset-bottom,8px);}
    .mob-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:none;background:none;cursor:pointer;padding:6px 4px;color:var(--gray);font-size:10px;font-weight:700;font-family:'Sora',sans-serif;transition:color .2s;}
    .mob-nav-btn.active{color:var(--red);}
    .mob-nav-btn:hover{color:var(--dark);}
    /* responsive */
    @media(max-width:768px){
      .mob-nav{display:flex!important;}
      main{padding-bottom:70px;}
      .hide-mobile{display:none!important;}
      h1{font-size:36px!important;}
      .pgrid{height:320px!important;}
      .pgrid .main{grid-row:1/2!important;}
    }
    @media(max-width:600px){
      h1{font-size:28px!important;}
      .dest-detail-grid{grid-template-columns:1fr!important;}
    }
  `}</style>
);

/* =============================================
   ICONS
============================================= */
const I = {
  Search:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:17,height:17}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Heart:({on})=><svg viewBox="0 0 24 24" fill={on?"#FF385C":"none"} stroke={on?"#FF385C":"#374151"} strokeWidth="2" strokeLinecap="round" style={{width:18,height:18}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Star:()=><svg viewBox="0 0 24 24" fill="#FF385C" style={{width:13,height:13}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Pin:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13,flexShrink:0}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Menu:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:16,height:16}}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  User:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:18,height:18}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  X:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:18,height:18}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Left:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{width:17,height:17}}><polyline points="15 18 9 12 15 6"/></svg>,
  Map:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:15,height:15}}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Shield:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:14,height:14}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Logout:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:15,height:15}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Upload:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:30,height:30,color:"#9ca3af"}}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Globe:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:14,height:14}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Eye:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  People:()=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:13,height:13}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

/* =============================================
   LIVE NOTIFICATION BELL (live unread badge)
============================================= */
function NavBell({ setPage }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(() => NOTIFS_STORE.unreadCount(user?.role, user?.email));
  useEffect(() => {
    return NOTIFS_STORE.subscribe(() => {
      setUnread(NOTIFS_STORE.unreadCount(user?.role, user?.email));
    });
  }, [user]);
  return (
    <button
      onClick={()=>setPage("notifications")}
      title="Notifications"
      style={{position:"relative",width:40,height:40,borderRadius:"50%",border:"1.5px solid var(--lg)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,transition:"box-shadow .2s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="var(--sh)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
    >
      🔔
      {unread>0 && (
        <div style={{position:"absolute",top:2,right:2,minWidth:18,height:18,borderRadius:9,background:"var(--red)",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",padding:"0 4px"}}>
          {unread>9?"9+":unread}
        </div>
      )}
    </button>
  );
}

/* =============================================
   NAVBAR
============================================= */
function Navbar({ setPage }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [editPanel, setEditPanel] = useState(false);
  const [bgImgs, setBgImgs] = useState(() => [...AUTH_PANEL_STORE.bgImgs]);
  const [bottomCards, setBottomCards] = useState(() => [...AUTH_PANEL_STORE.bottomCards]);

  // Sync modal state from store each time modal opens
  const openEditPanel = () => {
    setBgImgs([...AUTH_PANEL_STORE.bgImgs]);
    setBottomCards([...AUTH_PANEL_STORE.bottomCards]);
    setEditPanel(true);
  };
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <>
    <nav style={{position:"sticky",top:0,zIndex:200,background:"rgba(255,255,255,.96)",borderBottom:"1px solid var(--lg)",backdropFilter:"blur(14px)",padding:"0 36px",height:72,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setPage("home")}>
        <div style={{width:38,height:38,background:"linear-gradient(135deg,#FF385C,#ff6b35)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 12px rgba(255,56,92,.3)"}}>🏠</div>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"var(--red)",fontWeight:800,letterSpacing:-.5}}>StayBnb</span>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {user?.role==="host"&&<button className="btn gh" style={{fontSize:13,padding:"9px 16px",background:"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",border:"none"}} onClick={()=>setPage("newlisting")}>🏠 List Space</button>}
        <button className="btn gh" style={{fontSize:13,padding:"9px 16px",gap:6}} onClick={()=>setPage("explore")}><I.Map/>Map</button>
        {user?.role==="customer"&&<button onClick={()=>setPage("wishlist")} title="Wishlist" style={{width:40,height:40,borderRadius:"50%",border:"1.5px solid var(--lg)",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}} onMouseEnter={e=>e.currentTarget.style.boxShadow="var(--sh)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>❤️</button>}
        {user&&<NavBell setPage={setPage}/>}
        {user&&<div style={{padding:"4px 10px",borderRadius:20,background:user.role==="host"?"linear-gradient(135deg,#FF385C,#ff6b35)":"#e0f2fe",color:user.role==="host"?"#fff":"#0369a1",fontSize:11,fontWeight:800}}>{user.role==="host"?"🏠 HOST":"👤 GUEST"}</div>}
        <div style={{position:"relative"}} ref={ref}>
          <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,border:"1.5px solid var(--lg)",borderRadius:40,padding:"8px 14px",background:"#fff",cursor:"pointer",transition:"box-shadow .2s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 14px rgba(0,0,0,.12)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <I.Menu/>
            <div style={{width:30,height:30,borderRadius:"50%",background:user?"linear-gradient(135deg,#FF385C,#ff6b35)":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              {user?.avatar?<img src={user.avatar} alt={user.name||"User avatar"} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{color:"#fff"}}><I.User/></span>}
            </div>
          </button>
          {open&&(
            <div className="fu" style={{position:"absolute",right:0,top:"calc(100% + 10px)",background:"#fff",borderRadius:18,minWidth:230,border:"1px solid var(--lg)",boxShadow:"var(--sh2)",overflow:"hidden",zIndex:300}}>
              {user?(
                <>
                  <div style={{padding:"14px 18px",borderBottom:"1px solid var(--lg)",background:user.role==="host"?"#fff5f5":"#f0f9ff"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <img src={user.avatar} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover"}} alt={user.name}/>
                      <div><div style={{fontWeight:700,fontSize:14}}>{user.name}</div><div style={{color:"var(--gray)",fontSize:11}}>{user.email}</div></div>
                    </div>
                    <div style={{marginTop:8,display:"inline-flex",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:user.role==="host"?"#fff0f2":"#e0f2fe",color:user.role==="host"?"var(--red)":"#0369a1"}}>{user.role==="host"?"🏠 Host Admin":"👤 Guest Account"}</div>
                  </div>
                  {user.role==="host"
                    ?<>{[["dashboard","📊  Host Dashboard"],["newlisting","🏠  Add New Listing"],["bookings","📅  All Bookings"],["notifications","🔔  Notifications"],["profile","👤  My Profile"]].map(([p,l])=>(<button key={p} onClick={()=>{setPage(p);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"12px 20px",background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{l}</button>))}
                      <div style={{borderTop:"1px solid var(--lg)",margin:"4px 0"}}/>
                      <button onClick={()=>{openEditPanel();setOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 20px",background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,color:"var(--red)",fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#fff0f2"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{fontSize:16}}>🖼️</span> Edit Login Panel Images
                      </button>
                    </>
                    :[["profile","👤  My Profile"],["bookings","📅  My Bookings"],["wishlist","❤️  Wishlist"],["notifications","🔔  Notifications"]].map(([p,l])=>(<button key={p} onClick={()=>{setPage(p);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"12px 20px",background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{l}</button>))
                  }
                  <button onClick={()=>{logout();setOpen(false);}} style={{display:"flex",gap:8,alignItems:"center",width:"100%",padding:"13px 20px",background:"none",border:"none",borderTop:"1px solid var(--lg)",cursor:"pointer",fontSize:14,fontWeight:600,color:"var(--red)",fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#fff0f2"} onMouseLeave={e=>e.currentTarget.style.background="none"}><I.Logout/>Sign out</button>
                </>
              ):(
                <button onClick={()=>{setPage("login");setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"14px 20px",background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>Sign in</button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
    {/* ── LOGIN PANEL IMAGE EDITOR MODAL (host only) ── */}
    {editPanel && (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setEditPanel(false)}>
        <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 28px 90px rgba(0,0,0,.25)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #f3f4f6",background:"linear-gradient(135deg,#fff0f2,#fff8f5)",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:"var(--red)",letterSpacing:".08em",marginBottom:3}}>✏️ HOST · EDIT LOGIN PANEL</div>
              <div style={{fontWeight:800,fontSize:16,fontFamily:"'Playfair Display',serif"}}>Customize Background & Cards</div>
            </div>
            <button onClick={()=>setEditPanel(false)} style={{width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--lg)",background:"#f8f8f8",cursor:"pointer",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>

          <div style={{overflowY:"auto",padding:"16px 24px 24px",flex:1}}>
            {/* Slideshow images */}
            <div style={{fontSize:12,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:10,marginTop:4}}>🖼️ SLIDESHOW BACKGROUND IMAGES</div>
            {bgImgs.map((url,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <div style={{width:56,height:40,borderRadius:8,overflow:"hidden",background:"var(--bg)",flexShrink:0,border:"1px solid var(--lg)"}}>
                  <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.opacity=".2"}/>
                </div>
                <input
                  value={url}
                  onChange={e=>{const a=[...bgImgs];a[i]=e.target.value;setBgImgs(a);AUTH_PANEL_STORE.bgImgs=[...a];}}
                  style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--lg)",borderRadius:9,fontSize:12,fontFamily:"'Sora',sans-serif",outline:"none",background:"#fafafa"}}
                  placeholder="https://..."
                  onFocus={e=>e.target.style.borderColor="var(--red)"}
                  onBlur={e=>e.target.style.borderColor="var(--lg)"}
                />
                <span style={{fontSize:11,fontWeight:700,color:"var(--gray)",minWidth:16,textAlign:"center"}}>#{i+1}</span>
                {bgImgs.length>1&&(
                  <button onClick={()=>{const a=bgImgs.filter((_,j)=>j!==i);setBgImgs(a);AUTH_PANEL_STORE.bgImgs=[...a];}} style={{width:26,height:26,borderRadius:7,border:"1px solid #fca5a5",background:"#fff5f5",color:"#dc2626",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                )}
              </div>
            ))}
            <button onClick={()=>{const a=[...bgImgs,""];setBgImgs(a);AUTH_PANEL_STORE.bgImgs=[...a];}} style={{width:"100%",padding:"8px",borderRadius:9,border:"1.5px dashed var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",marginBottom:22}}>+ Add Slide Image</button>

            {/* Bottom destination cards */}
            <div style={{fontSize:12,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:10}}>🗂️ DESTINATION CARDS (bottom of panel)</div>
            {bottomCards.map((card,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <div style={{width:56,height:40,borderRadius:8,overflow:"hidden",background:"var(--bg)",flexShrink:0,border:"1px solid var(--lg)"}}>
                  <img src={card.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.opacity=".2"}/>
                </div>
                <input
                  value={card.img}
                  onChange={e=>{const a=[...bottomCards];a[i]={...a[i],img:e.target.value};setBottomCards(a);AUTH_PANEL_STORE.bottomCards=[...a];}}
                  style={{flex:2,padding:"8px 12px",border:"1.5px solid var(--lg)",borderRadius:9,fontSize:12,fontFamily:"'Sora',sans-serif",outline:"none",background:"#fafafa"}}
                  placeholder="Image URL"
                  onFocus={e=>e.target.style.borderColor="var(--red)"}
                  onBlur={e=>e.target.style.borderColor="var(--lg)"}
                />
                <input
                  value={card.label}
                  onChange={e=>{const a=[...bottomCards];a[i]={...a[i],label:e.target.value};setBottomCards(a);AUTH_PANEL_STORE.bottomCards=[...a];}}
                  style={{flex:1,padding:"8px 12px",border:"1.5px solid var(--lg)",borderRadius:9,fontSize:12,fontFamily:"'Sora',sans-serif",outline:"none",background:"#fafafa"}}
                  placeholder="Label"
                  onFocus={e=>e.target.style.borderColor="var(--red)"}
                  onBlur={e=>e.target.style.borderColor="var(--lg)"}
                />
                {bottomCards.length>1&&(
                  <button onClick={()=>{const a=bottomCards.filter((_,j)=>j!==i);setBottomCards(a);AUTH_PANEL_STORE.bottomCards=[...a];}} style={{width:26,height:26,borderRadius:7,border:"1px solid #fca5a5",background:"#fff5f5",color:"#dc2626",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                )}
              </div>
            ))}
            <button onClick={()=>{const a=[...bottomCards,{img:"",label:"New"}];setBottomCards(a);AUTH_PANEL_STORE.bottomCards=[...a];}} style={{width:"100%",padding:"8px",borderRadius:9,border:"1.5px dashed var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>+ Add Card</button>
          </div>

          <div style={{padding:"14px 24px",borderTop:"1px solid #f3f4f6",background:"#fafafa",flexShrink:0}}>
            <button onClick={()=>setEditPanel(false)} style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Sora',sans-serif",boxShadow:"0 4px 16px rgba(255,56,92,.3)"}}>
              ✅ Done — Changes Saved
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}


/* =============================================
   PLACES SECTION (must-visit across India)
============================================= */
const REGION_COLORS = { North:"#f59e0b", South:"#10b981", East:"#3b82f6", West:"#f97316", Northeast:"#8b5cf6", Mountains:"#06b6d4" };
const CAT_COLORS = { Monument:"#f59e0b", Fort:"#ef4444", Palace:"#8b5cf6", Temple:"#ec4899", Spiritual:"#7c3aed", Nature:"#10b981", Beach:"#0ea5e9", Wildlife:"#16a34a" };

/* =============================================
   PLACE EDIT MODAL (host only)
============================================= */
function PlaceEditModal({ place, onSave, onClose }) {
  const [form, setForm] = useState({
    name: place.name,
    city: place.city,
    state: place.state,
    region: place.region,
    category: place.category,
    visitors: place.visitors,
    desc: place.desc,
    img: place.img,
    color: place.color,
    tags: place.tags.join(", "),
  });
  const [imgPreview, setImgPreview] = useState(place.img);
  const [previewError, setPreviewError] = useState(false);
  const [saved, setSaved] = useState(false);

  const inp = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    style: {
      width:"100%", padding:"9px 12px", border:"1.5px solid var(--lg)",
      borderRadius:10, fontSize:13, fontFamily:"'Sora',sans-serif",
      outline:"none", boxSizing:"border-box", background:"#fafafa",
      transition:"border-color .2s",
    },
    onFocus: e => e.target.style.borderColor = "var(--red)",
    onBlur: e => e.target.style.borderColor = "var(--lg)",
  });

  const label = (txt) => (
    <div style={{fontSize:11,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:5,marginTop:14}}>{txt}</div>
  );

  const handleSave = () => {
    const updated = {
      ...place,
      ...form,
      tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      img: imgPreview,
    };
    onSave(updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:580,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.22)",animation:"modalIn .22s ease"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"22px 26px 16px",borderBottom:"1px solid var(--lg)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#fff",zIndex:1,borderRadius:"22px 22px 0 0"}}>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"var(--red)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:3}}>✏️ Host Edit Mode</div>
            <div style={{fontWeight:800,fontSize:17,fontFamily:"'Playfair Display',serif"}}>Edit Place Details</div>
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--lg)",background:"#f8f8f8",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button>
        </div>

        <div style={{padding:"8px 26px 26px"}}>

          {/* Image preview + URL */}
          <div style={{marginTop:16,borderRadius:16,overflow:"hidden",height:180,position:"relative",background:"var(--bg)"}}>
            <img
              src={imgPreview}
              alt="preview"
              style={{width:"100%",height:"100%",objectFit:"cover"}}
              onError={()=>setPreviewError(true)}
              onLoad={()=>setPreviewError(false)}
            />
            {previewError && (
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#f1f5f9",color:"var(--gray)",fontSize:13,gap:6}}>
                <span style={{fontSize:32}}>🖼️</span>
                <span>Invalid image URL</span>
              </div>
            )}
            <div style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:8,backdropFilter:"blur(4px)"}}>PREVIEW</div>
          </div>

          {label("IMAGE URL")}
          <input {...inp("img")} placeholder="https://picsum.photos/seed/..." onBlur={e=>{e.target.style.borderColor="var(--lg)";setImgPreview(form.img);}} onFocus={e=>e.target.style.borderColor="var(--red)"}/>
          <button onClick={()=>setImgPreview(form.img)} style={{marginTop:6,padding:"6px 14px",borderRadius:8,border:"1.5px solid var(--red)",background:"#fff0f3",color:"var(--red)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>🔄 Preview Image</button>

          {/* Extra image slots */}
          {label("ADD MORE IMAGES (comma-separated URLs)")}
          <textarea
            placeholder="https://url1.com, https://url2.com, ..."
            style={{width:"100%",padding:"9px 12px",border:"1.5px solid var(--lg)",borderRadius:10,fontSize:12,fontFamily:"'Sora',sans-serif",outline:"none",boxSizing:"border-box",background:"#fafafa",minHeight:64,resize:"vertical"}}
            onFocus={e=>e.target.style.borderColor="var(--red)"}
            onBlur={e=>e.target.style.borderColor="var(--lg)"}
          />

          {/* Row: Name */}
          {label("PLACE NAME")}
          <input {...inp("name")} placeholder="e.g. Taj Mahal"/>

          {/* Row: City + State */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              {label("CITY")}
              <input {...inp("city")} placeholder="City"/>
            </div>
            <div>
              {label("STATE")}
              <input {...inp("state")} placeholder="State"/>
            </div>
          </div>

          {/* Row: Region + Category */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              {label("REGION")}
              <select {...inp("region")} style={{...inp("region").style,appearance:"auto"}}>
                {["North","South","East","West","Northeast","Mountains"].map(r=><option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              {label("CATEGORY")}
              <select {...inp("category")} style={{...inp("category").style,appearance:"auto"}}>
                {["Monument","Fort","Palace","Temple","Spiritual","Nature","Beach","Wildlife"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Visitors */}
          {label("ANNUAL VISITORS")}
          <input {...inp("visitors")} placeholder="e.g. 7M+/yr"/>

          {/* Accent color */}
          {label("ACCENT COLOR")}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{width:44,height:36,borderRadius:8,border:"1.5px solid var(--lg)",cursor:"pointer",padding:2}}/>
            <input {...inp("color")} style={{...inp("color").style,flex:1}} placeholder="#f59e0b"/>
          </div>

          {/* Description */}
          {label("DESCRIPTION")}
          <textarea {...inp("desc")} style={{...inp("desc").style,minHeight:80,resize:"vertical"}} placeholder="Brief description of this place..."/>

          {/* Tags */}
          {label("TAGS (comma-separated)")}
          <input {...inp("tags")} placeholder="e.g. UNESCO, Heritage, Photography"/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
            {form.tags.split(",").map(t=>t.trim()).filter(Boolean).map(t=>(
              <span key={t} style={{background:"#ff385c15",color:"var(--red)",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700}}>{t}</span>
            ))}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{marginTop:22,width:"100%",padding:"13px",borderRadius:13,border:"none",background:saved?"#10b981":"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .25s",boxShadow:"0 4px 18px rgba(255,56,92,.3)"}}
          >
            {saved ? "✅ Saved!" : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlacesSection() {
  const { user } = useAuth();
  const isHost = user?.role === "host";
  const [region, setRegion] = useState("All");
  const [cat, setCat] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [places, setPlaces] = useState(() => {
    try {
      const saved = localStorage.getItem("staybnb_places");
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedMap = new Map(parsed.map(p => [p.id, p]));
        return PLACES.map(p => savedMap.has(p.id) ? savedMap.get(p.id) : { ...p });
      }
    } catch(e) {}
    return PLACES;
  });
  const [editing, setEditing] = useState(null); // place being edited

  const shown = places.filter(p=>(region==="All"||p.region===region)&&(cat==="All"||p.category===cat));

  const handleSave = (updated) => {
    setPlaces(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      try {
        localStorage.setItem("staybnb_places", JSON.stringify(next));
        console.log(`✅ Place saved: "${updated.name}" | localStorage updated`);
      } catch(e) {}
      return next;
    });
    setEditing(null);
  };

  return (
    <section style={{maxWidth:1380,margin:"0 auto",padding:"52px 36px"}}>
      {/* Header */}
      <div style={{marginBottom:32}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:4,height:32,background:"linear-gradient(180deg,#FF385C,#ff6b35)",borderRadius:4}}/>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"var(--red)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>🇮🇳 Bucket List</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:800,letterSpacing:-.5,lineHeight:1.1}}>Must-Visit Places across India</h2>
          </div>
        </div>
        <p style={{color:"var(--gray)",fontSize:15,marginLeft:14,maxWidth:620}}>From Himalayan peaks to tropical backwaters — iconic landmarks where millions of travellers go every year</p>
        {isHost && (
          <div style={{marginLeft:14,marginTop:10,display:"inline-flex",alignItems:"center",gap:7,background:"#fff7ed",border:"1.5px solid #fed7aa",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,color:"#92400e"}}>
            ✏️ Host Mode · Click <b style={{color:"var(--red)"}}>Edit Place</b> on any card to update details
          </div>
        )}
      </div>

      {/* Region filter pills */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:8}}>REGION</div>
        <div className="pills" style={{marginBottom:0}}>
          {REGIONS.map(r=>{
            const active = region===r;
            const col = r==="All"?"var(--dark)":REGION_COLORS[r];
            return (
              <button key={r} onClick={()=>setRegion(r)} style={{flexShrink:0,padding:"7px 18px",borderRadius:40,border:`1.5px solid ${active?col:"var(--lg)"}`,background:active?col:"#fff",color:active?"#fff":col==="var(--dark)"?"var(--dark)":col,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .18s",whiteSpace:"nowrap",fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor=col;e.currentTarget.style.background="rgba(0,0,0,.04)";}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor="var(--lg)";e.currentTarget.style.background="#fff";}}}>
                {r==="All"?"🌏 All":r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:8}}>CATEGORY</div>
        <div className="pills">
          {CATEGORIES.map(c=>{
            const active=cat===c;
            const col=c==="All"?"var(--dark)":CAT_COLORS[c]||"var(--dark)";
            return (
              <button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,padding:"7px 18px",borderRadius:40,border:`1.5px solid ${active?col:"var(--lg)"}`,background:active?col:"#fff",color:active?"#fff":col,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .18s",whiteSpace:"nowrap",fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor=col;e.currentTarget.style.background="rgba(0,0,0,.04)";}}} onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor="var(--lg)";e.currentTarget.style.background="#fff";}}}>
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{fontSize:12,fontWeight:600,color:"var(--gray)",marginBottom:20,display:"flex",alignItems:"center",gap:6}}><span className="dot"/>{shown.length} places found</div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:22}}>
        {shown.map((p,i)=>(
          <div key={p.id} className={`place-card fu s${(i%12)+1}`} style={{position:"relative"}}>
            <div style={{position:"relative",overflow:"hidden"}}>
              <img className="place-img" src={p.img} alt={p.name} onError={e=>e.target.src="https://picsum.photos/seed/b28074a5d7da/600/800"}/>
              {/* Overlay gradient */}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 50%)"}}/>
              {/* Region badge */}
              <div style={{position:"absolute",top:12,left:12,background:REGION_COLORS[p.region]||"#6b7280",color:"#fff",padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:800,letterSpacing:".06em",textTransform:"uppercase",boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>{p.region}</div>
              {/* Visitors */}
              <div style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,.5)",color:"#fff",padding:"4px 10px",borderRadius:12,fontSize:10,fontWeight:700,backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:4}}><I.People/>{p.visitors}</div>
              {/* Host Edit button on image top-right (below visitors) */}
              {isHost && (
                <button
                  onClick={e=>{e.stopPropagation();setEditing(p);}}
                  style={{position:"absolute",top:42,right:12,background:"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",border:"none",borderRadius:10,padding:"5px 11px",fontSize:11,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:5,boxShadow:"0 3px 10px rgba(255,56,92,.4)",fontFamily:"'Sora',sans-serif",letterSpacing:".02em",zIndex:2,transition:"transform .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.07)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                >
                  ✏️ Edit Place
                </button>
              )}
              {/* Name on image */}
              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"16px 16px 14px"}}>
                <div style={{color:"#fff",fontWeight:800,fontSize:18,lineHeight:1.2,textShadow:"0 1px 4px rgba(0,0,0,.4)"}}>{p.name}</div>
                <div style={{color:"rgba(255,255,255,.8)",fontSize:12,display:"flex",alignItems:"center",gap:4,marginTop:3}}><I.Pin/>{p.city}, {p.state}</div>
              </div>
            </div>
            <div style={{padding:"16px 18px 18px"}}>
              {/* Category tag */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:700,letterSpacing:".04em",background:`${CAT_COLORS[p.category]}20`,color:CAT_COLORS[p.category]||"var(--gray)"}}>{p.category}</span>
                <div style={{display:"flex",gap:4}}>
                  {p.tags.slice(0,2).map(t=><span key={t} style={{background:"var(--bg)",color:"var(--gray)",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600}}>{t}</span>)}
                </div>
              </div>
              <p style={{fontSize:13,color:"var(--gray)",lineHeight:1.6,marginBottom:14}}>{p.desc}</p>
              {/* Expand / collapse */}
              <button onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{background:"none",border:"1.5px solid var(--lg)",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--dark)",width:"100%",transition:"all .2s",fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="var(--dark)";}}>
                {expanded===p.id?"▲ Show less":"▼ More details + Nearby Stays"}
              </button>
              {expanded===p.id&&(
                <div className="fu" style={{marginTop:14,padding:"14px",background:"#fff9f0",borderRadius:14,border:"1px solid #fed7aa"}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#92400e",marginBottom:8,letterSpacing:".06em"}}>ALL TAGS</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                    {p.tags.map(t=><span key={t} style={{background:"#ff385c15",color:"var(--red)",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700}}>{t}</span>)}
                  </div>
                  <div style={{fontSize:12,fontWeight:800,color:"#92400e",marginBottom:6,letterSpacing:".06em"}}>ANNUAL VISITORS</div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--dark)",marginBottom:12,display:"flex",alignItems:"center",gap:6}}><I.Eye/>{p.visitors} visitors per year</div>
                  <div style={{fontSize:11,color:"var(--gray)",fontStyle:"italic"}}>📍 {p.city}, {p.state} · {p.region} India</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && <PlaceEditModal place={editing} onSave={handleSave} onClose={()=>setEditing(null)}/>}
    </section>
  );
}

/* =============================================
   LISTING EDIT MODAL (host only)
============================================= */
function ListingEditModal({ listing, onSave, onClose }) {
  const AMENITY_LIST = ["WiFi","Pool","AC","Kitchen","Parking","Breakfast","Fireplace","Balcony","Gym","Chef","Fishing","Workspace","Garden","Rooftop","Beach Access","Boat Tour","Camel Safari","Stargazing","Bonfire","Folk Music","Coffee Tour","Sunset Cruise","Trekking Maps","Heating","Heritage Tour","Sea View","Dinner","Terrace","Yoga Class","Meditation","Boat Ride","Ghat Access","Ayurveda","Tea Tour","Mountain View","Sunrise View","Hiking","Snorkeling","Kayak","Sunset Deck","Lake View","River View","Concierge"];
  const TYPES = ["Villa","Apartment","Cabin","Heritage","Houseboat","Glamping","Treehouse","Tent","Cottage","Studio"];

  const [form, setForm] = useState({
    title: listing.title,
    location: listing.location,
    price: listing.price,
    type: listing.type,
    description: listing.description||"",
    bedrooms: listing.bedrooms||1,
    bathrooms: listing.bathrooms||1,
    maxGuests: listing.maxGuests||2,
    amenities: [...(listing.amenities||[])],
    images: [...(listing.images||[])],
    rating: listing.rating,
  });
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("basic"); // basic | images | amenities

  const fi = {width:"100%",padding:"10px 13px",border:"1.5px solid var(--lg)",borderRadius:10,fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",background:"#fafafa",boxSizing:"border-box",transition:"border-color .2s"};
  const lbl = (t) => <div style={{fontSize:11,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:5,marginTop:14}}>{t}</div>;

  const handleSave = () => {
    // Filter out empty image URLs before saving
    const cleanImages = form.images.filter(img => img && img.trim() !== "");
    const updated = {
      ...listing,
      ...form,
      images: cleanImages.length > 0 ? cleanImages : listing.images,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      maxGuests: Number(form.maxGuests),
    };
    onSave(updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const updateImg = (idx, val) => {
    const imgs = [...form.images];
    imgs[idx] = val;
    setForm(f=>({...f, images: imgs}));
  };
  const addImg = () => setForm(f=>({...f, images:[...f.images, ""]}));
  const removeImg = (idx) => setForm(f=>({...f, images: f.images.filter((_,i)=>i!==idx)}));
  const toggleAmenity = (a) => setForm(f=>({...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x=>x!==a) : [...f.amenities, a]}));

  const tabStyle = (t) => ({padding:"9px 18px",borderRadius:10,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .2s",background:tab===t?"var(--red)":"#f3f4f6",color:tab===t?"#fff":"#6b7280"});

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:620,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 28px 90px rgba(0,0,0,.25)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"20px 26px 16px",borderBottom:"1px solid var(--lg)",background:"linear-gradient(135deg,#fff0f2,#fff8f5)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:11,fontWeight:800,color:"var(--red)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:3}}>✏️ Host · Edit Listing</div>
              <div style={{fontWeight:800,fontSize:17,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>{listing.title}</div>
            </div>
            <button onClick={onClose} style={{width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--lg)",background:"#f8f8f8",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>✕</button>
          </div>
          {/* Tab bar */}
          <div style={{display:"flex",gap:8,marginTop:14}}>
            {[["basic","📋 Basic Info"],["images","🖼️ Images"],["amenities","✅ Amenities"]].map(([k,lbl])=>(
              <button key={k} onClick={()=>setTab(k)} style={tabStyle(k)}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{overflowY:"auto",padding:"8px 26px 24px",flex:1}}>

          {/* ── BASIC INFO TAB ── */}
          {tab==="basic" && (
            <div>
              {lbl("LISTING TITLE")}
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={fi} placeholder="e.g. Beachfront Infinity Pool Villa" onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>

              {lbl("LOCATION")}
              <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} style={fi} placeholder="City, State" onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  {lbl("PRICE / NIGHT (Rs.)")}
                  <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>
                </div>
                <div>
                  {lbl("PROPERTY TYPE")}
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{...fi,appearance:"auto"}}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div>{lbl("BEDROOMS")}<input type="number" min={1} value={form.bedrooms} onChange={e=>setForm(f=>({...f,bedrooms:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/></div>
                <div>{lbl("BATHROOMS")}<input type="number" min={1} value={form.bathrooms} onChange={e=>setForm(f=>({...f,bathrooms:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/></div>
                <div>{lbl("MAX GUESTS")}<input type="number" min={1} value={form.maxGuests} onChange={e=>setForm(f=>({...f,maxGuests:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/></div>
              </div>

              {lbl("DESCRIPTION")}
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{...fi,minHeight:90,resize:"vertical"}} placeholder="Describe this property…" onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>
            </div>
          )}

          {/* ── IMAGES TAB ── */}
          {tab==="images" && (
            <div>
              <div style={{marginTop:14,fontSize:13,color:"var(--gray)",marginBottom:4}}>Edit, reorder or add image URLs. First image is the cover photo.</div>
              {form.images.map((img,idx)=>(
                <div key={idx} style={{display:"flex",gap:8,alignItems:"center",marginTop:10}}>
                  <div style={{width:60,height:44,borderRadius:8,overflow:"hidden",background:"var(--bg)",flexShrink:0,border:"1px solid var(--lg)"}}>
                    <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.opacity=".3"}/>
                  </div>
                  <input value={img} onChange={e=>updateImg(idx,e.target.value)} style={{...fi,flex:1}} placeholder="https://..." onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--gray)",flexShrink:0,minWidth:20,textAlign:"center"}}>{idx===0?"📌":"#"+(idx+1)}</span>
                  {form.images.length>1&&<button onClick={()=>removeImg(idx)} style={{width:28,height:28,borderRadius:8,border:"1px solid #fca5a5",background:"#fff5f5",color:"#dc2626",cursor:"pointer",fontSize:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
                </div>
              ))}
              <button onClick={addImg} style={{marginTop:12,padding:"8px 16px",borderRadius:10,border:"1.5px dashed var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",width:"100%"}}>+ Add Image URL</button>
            </div>
          )}

          {/* ── AMENITIES TAB ── */}
          {tab==="amenities" && (
            <div>
              <div style={{marginTop:14,fontSize:13,color:"var(--gray)",marginBottom:12}}>{form.amenities.length} amenities selected</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {AMENITY_LIST.map(a=>{
                  const on=form.amenities.includes(a);
                  return (
                    <button key={a} onClick={()=>toggleAmenity(a)} style={{padding:"10px 12px",border:`1.5px solid ${on?"var(--red)":"var(--lg)"}`,background:on?"#fff0f3":"#fff",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontWeight:on?700:500,fontSize:12,transition:"all .15s",fontFamily:"'Sora',sans-serif",color:on?"var(--red)":"var(--dark)",textAlign:"left"}}>
                      <span style={{fontSize:15,flexShrink:0}}>{AICONS[a]||"✅"}</span>{a}{on&&<span style={{marginLeft:"auto",color:"var(--red)"}}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer save */}
        <div style={{padding:"16px 26px",borderTop:"1px solid var(--lg)",background:"#fafafa",flexShrink:0}}>
          <button onClick={handleSave} style={{width:"100%",padding:"14px",borderRadius:13,border:"none",background:saved?"#10b981":"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .25s",boxShadow:"0 4px 18px rgba(255,56,92,.3)"}}>
            {saved?"✅ Saved Successfully!":"💾 Save Listing Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   LISTING CARD
============================================= */
function Card({ l, delay=0, onClick, isHost=false, onEdit }) {
  const [liked, setLiked] = useState(false);
  const [img, setImg] = useState(0);
  const fb = "https://picsum.photos/seed/9991f1c4c750/600/800";
  const total = l.images.length;
  const maxDots = 5;
  return (
    <div className={`card fu s${(delay%12)+1}`} onClick={onClick} style={{position:"relative"}}>
      <div style={{position:"relative",height:220,overflow:"hidden",background:"var(--bg)"}}>
        <img src={l.images[img]} alt={l.title} onError={e=>e.target.src=fb}
          style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .45s ease,opacity .3s"}}
          onMouseEnter={e=>e.target.style.transform="scale(1.06)"}
          onMouseLeave={e=>e.target.style.transform="none"}/>

        {/* Gradient overlay */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:56,background:"linear-gradient(to top,rgba(0,0,0,.35),transparent)",pointerEvents:"none"}}/>

        {/* Dots */}
        {total>1&&(
          <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5,alignItems:"center"}}>
            {Array.from({length:Math.min(total,maxDots)}).map((_,i)=>(
              <button key={i} onClick={e=>{e.stopPropagation();setImg(i);}}
                style={{width:i===img?18:6,height:6,borderRadius:6,border:"none",background:i===img?"#fff":"rgba(255,255,255,.55)",padding:0,cursor:"pointer",transition:"all .25s"}}/>
            ))}
            {total>maxDots&&<span style={{color:"rgba(255,255,255,.8)",fontSize:10,fontWeight:700}}>+{total-maxDots}</span>}
          </div>
        )}

        {/* Arrows */}
        {img>0&&(
          <button onClick={e=>{e.stopPropagation();setImg(i=>i-1);}}
            style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,.92)",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)",transition:"transform .15s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-50%) scale(1.1)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(-50%)"}><I.Left/></button>
        )}
        {img<total-1&&(
          <button onClick={e=>{e.stopPropagation();setImg(i=>i+1);}}
            style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%) rotate(180deg)",background:"rgba(255,255,255,.92)",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)",transition:"transform .15s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-50%) rotate(180deg) scale(1.1)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(-50%) rotate(180deg)"}><I.Left/></button>
        )}

        {/* Counter */}
        <div style={{position:"absolute",top:12,right:52,background:"rgba(0,0,0,.45)",color:"#fff",borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:700,backdropFilter:"blur(4px)"}}>
          {img+1}/{total}
        </div>

        <button className="heart" onClick={e=>{e.stopPropagation();setLiked(v=>!v);}}><I.Heart on={liked}/></button>
        <span style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,.92)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,backdropFilter:"blur(4px)"}}>{l.type}</span>
        {l.host.superhost&&<span style={{position:"absolute",top:38,left:12,background:"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700}}>⭐ Superhost</span>}

        {/* Host edit button */}
        {isHost && onEdit && (
          <button
            onClick={e=>{e.stopPropagation();onEdit(l);}}
            style={{position:"absolute",bottom:12,right:12,background:"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",border:"none",borderRadius:10,padding:"6px 13px",fontSize:11,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:5,boxShadow:"0 3px 12px rgba(255,56,92,.45)",fontFamily:"'Sora',sans-serif",zIndex:2,transition:"transform .15s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.07)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >
            ✏️ Edit
          </button>
        )}
      </div>
      <div style={{padding:"14px 4px 8px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
          <div style={{fontWeight:700,fontSize:14,lineHeight:1.3,flex:1}}>{l.title}</div>
          <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}><I.Star/><span style={{fontSize:13,fontWeight:700}}>{l.rating}</span></div>
        </div>
        <div style={{color:"var(--gray)",fontSize:12,marginTop:3,display:"flex",alignItems:"center",gap:3}}><I.Pin/>{l.location}</div>
        <div style={{marginTop:7,fontSize:14}}><b>Rs.{l.price.toLocaleString()}</b><span style={{color:"var(--gray)",fontWeight:400}}> / night</span></div>
      </div>
    </div>
  );
}

/* =============================================
   DESTINATION CARD
============================================= */
function DestCard({ d, delay, onClick }) {
  return (
    <div className={`dc fu s${(delay%12)+1}`} onClick={onClick} style={{height:160}}>
      <img src={d.img} alt={d.name} onError={e=>e.target.src="https://picsum.photos/seed/b28074a5d7da/400/800"}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 55%)",borderRadius:18}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"13px 13px"}}>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div><div style={{color:"#fff",fontWeight:800,fontSize:15,lineHeight:1.2}}>{d.emoji} {d.name}</div><div style={{color:"rgba(255,255,255,.75)",fontSize:11,marginTop:2}}>{d.state}</div></div>
          <div style={{background:"rgba(255,255,255,.2)",backdropFilter:"blur(8px)",color:"#fff",borderRadius:10,padding:"3px 9px",fontSize:11,fontWeight:700,border:"1px solid rgba(255,255,255,.3)"}}>{d.listings}+</div>
        </div>
        <div style={{color:"rgba(255,255,255,.65)",fontSize:11,marginTop:4}}>{d.tag}</div>
      </div>
    </div>
  );
}

/* =============================================
   HOME PAGE
============================================= */
// eslint-disable-next-line no-unused-vars
const var_lg = "var(--lg)";

function Home({ setPage, setL }) {
  const { user } = useAuth();
  const isHost = user?.role === "host";
  const [type, setType] = useState("All");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [destFilter, setDestFilter] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [maxPrice, setMaxPrice] = useState(15000);
  const [showFilters, setShowFilters] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("");
  const [listings, setListings] = useState(() => LISTINGS_STORE.getAll());
  const [editTarget, setEditTarget] = useState(null);
  const leaflet = useLeaflet();
  useEffect(()=>{ setTimeout(()=>setLoading(false),900); },[]);
  useEffect(() => LISTINGS_STORE.subscribe(data => setListings([...data])), []);

  const handleListingEdit = (updated) => {
    LISTINGS_STORE.update(updated);
    setEditTarget(null);
  };

  const types = ["All","Villa","Apartment","Cabin","Heritage","Houseboat","Glamping"];

  let filtered = listings.filter(l =>
    (type==="All" || l.type===type) &&
    (!destFilter || l.dest===destFilter || l.location.toLowerCase().includes(destFilter.toLowerCase())) &&
    (!q || l.location.toLowerCase().includes(q.toLowerCase()) || l.title.toLowerCase().includes(q.toLowerCase())) &&
    l.price <= maxPrice
  );

  if (sortBy==="price_asc") filtered = [...filtered].sort((a,b)=>a.price-b.price);
  else if (sortBy==="price_desc") filtered = [...filtered].sort((a,b)=>b.price-a.price);
  else if (sortBy==="rating") filtered = [...filtered].sort((a,b)=>b.rating-a.rating);

  const scrollTo = id => { const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); };

  const handleAISearch = async () => {
    if (!q.trim()) return;
    setAiLoading(true); setAiSuggestion("");
    try {
      const res = await callClaude(
        `A user is searching for "${q}" on StayBnb India. Available destinations: Goa, Jaipur, Manali, Kerala, Agra, Varanasi, Shimla, Mumbai, Udaipur, Darjeeling, Rishikesh, Coorg. 
         Give a 1-sentence helpful tip about what they might find there, or suggest the closest matching destination if their query is vague. Keep it under 20 words.`,
        "You are a concise StayBnb travel assistant. Give short helpful hints."
      );
      setAiSuggestion(res);
    } catch { setAiSuggestion(""); }
    setAiLoading(false);
    scrollTo("ls");
  };

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{background:"linear-gradient(160deg,#fff8f5 0%,#fef9ee 45%,#f5f9ff 100%)",padding:"56px 40px 44px",borderBottom:"1px solid var(--lg)"}}>
        <div style={{maxWidth:920,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span className="dot"/>
            <span style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>{listings.length} verified stays live across India</span>
            {user && <span style={{marginLeft:8,fontSize:12,fontWeight:700,color:"var(--gray)"}}>· Welcome back, {user.name.split(" ")[0]}! 👋</span>}
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:52,lineHeight:1.08,marginBottom:12,letterSpacing:-.8}}>
            Find where <em style={{color:"var(--red)"}}>you belong</em>
          </h1>
          <p style={{color:"var(--gray)",fontSize:17,marginBottom:32,maxWidth:520}}>
            Handpicked villas, havelis, houseboats & cabins across India's most magical destinations
          </p>

          {/* ── SEARCH BAR ── */}
          <div style={{display:"flex",alignItems:"center",border:"2px solid var(--lg)",borderRadius:50,background:"#fff",boxShadow:"var(--sh2)",overflow:"hidden",maxWidth:920}}>
            <div style={{flex:2.5,padding:"15px 22px",borderRight:"1px solid var(--lg)"}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:".08em",color:"var(--dark)",marginBottom:3}}>WHERE</div>
              <input value={q} onChange={e=>{setQ(e.target.value);setAiSuggestion("");}} onKeyDown={e=>e.key==="Enter"&&handleAISearch()} placeholder="Goa, Jaipur, Kerala, Manali…" style={{border:"none",fontSize:14,fontWeight:500,width:"100%",background:"transparent",color:"var(--dark)"}}/>
            </div>
            <div style={{flex:1,padding:"15px 18px",borderRight:"1px solid var(--lg)"}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:".08em",color:"var(--dark)",marginBottom:3}}>CHECK IN</div>
              <input type="date" value={checkin} onChange={e=>setCheckin(e.target.value)} style={{border:"none",fontSize:13,fontWeight:500,background:"transparent",color:"var(--gray)",width:"100%"}}/>
            </div>
            <div style={{flex:1,padding:"15px 18px",borderRight:"1px solid var(--lg)"}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:".08em",color:"var(--dark)",marginBottom:3}}>CHECK OUT</div>
              <input type="date" value={checkout} onChange={e=>setCheckout(e.target.value)} style={{border:"none",fontSize:13,fontWeight:500,background:"transparent",color:"var(--gray)",width:"100%"}}/>
            </div>
            <div style={{flex:.65,padding:"15px 14px"}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:".08em",color:"var(--dark)",marginBottom:3}}>GUESTS</div>
              <input type="number" min={1} max={20} value={guests} onChange={e=>setGuests(e.target.value)} placeholder="Add" style={{border:"none",fontSize:13,fontWeight:500,background:"transparent",color:"var(--gray)",width:60}}/>
            </div>
            <div style={{padding:"7px 10px 7px 0",display:"flex",gap:6}}>
              <button className="btn r" style={{borderRadius:40,width:54,height:54,padding:0}} onClick={handleAISearch} title="AI-powered search">
                {aiLoading ? <div style={{width:18,height:18,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/> : <I.Search/>}
              </button>
            </div>
          </div>

          {/* AI suggestion */}
          {aiSuggestion && (
            <div className="fu" style={{marginTop:12,background:"rgba(255,56,92,.08)",border:"1px solid rgba(255,56,92,.2)",borderRadius:12,padding:"10px 18px",display:"flex",alignItems:"center",gap:10,maxWidth:920}}>
              <span style={{fontSize:18}}>🤖</span>
              <span style={{fontSize:13,fontWeight:500,color:"var(--dark)"}}>{aiSuggestion}</span>
            </div>
          )}

          {/* Trending chips */}
          <div style={{marginTop:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--gray)",marginBottom:10}}>🔥 Trending now</div>
            <div className="trow">
              {DESTINATIONS.slice(0,8).map(d=>(
                <button key={d.name} className="chip" onClick={()=>{setDestFilter(d.name===destFilter?null:d.name);setQ(d.name===destFilter?"":d.name);scrollTo("ls");}}>
                  <img src={d.img} alt={d.name} onError={e=>e.target.src="https://picsum.photos/seed/fallback80/80/80"}/>{d.name}
                </button>
              ))}
              {destFilter&&<button className="chip" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>{setDestFilter(null);setQ("");}}>✕ Clear</button>}
            </div>
          </div>
        </div>
      </div>

      {/* POPULAR DESTINATIONS */}
      <div style={{maxWidth:1380,margin:"0 auto",padding:"48px 36px 32px"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--red)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Where to stay</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,letterSpacing:-.5}}>Popular Destinations across India</h2>
          <p style={{color:"var(--gray)",fontSize:14,marginTop:6}}>Click any destination to browse its stays</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:14}}>
          {DESTINATIONS.map((d,i)=><DestCard key={d.name} d={d} delay={i} onClick={()=>{setDestFilter(d.name);setQ(d.name);scrollTo("ls");}}/>)}
        </div>
      </div>

      <div style={{maxWidth:1380,margin:"0 auto",padding:"0 36px"}}><div style={{height:1,background:"var(--lg)"}}/></div>
      <PlacesSection/>
      <div style={{maxWidth:1380,margin:"0 auto",padding:"0 36px"}}><div style={{height:1,background:"var(--lg)"}}/></div>

      {/* LIVE MAP */}
      {leaflet&&(
        <div style={{position:"relative",height:220,overflow:"hidden",borderTop:"1px solid var(--lg)",borderBottom:"1px solid var(--lg)"}}>
          <MapView lat={22.5} lng={80} title="India" zoom={5} markers={filtered.map(l=>({lat:l.lat,lng:l.lng,title:l.title,price:l.price}))}/>
          <div onClick={()=>setPage("explore")} style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",background:"var(--dark)",color:"#fff",padding:"10px 24px",borderRadius:40,fontWeight:700,fontSize:13,boxShadow:"var(--sh2)",cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8}}>🗺️ Open interactive map · {filtered.length} stays</div>
        </div>
      )}

      {/* ── FILTERS BAR ── */}
      <div id="ls" style={{padding:"12px 36px",borderBottom:"1px solid var(--lg)",background:"#fff",position:"sticky",top:72,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {/* Type pills */}
          <div className="pills" style={{flex:1}}>
            {types.map(t=><button key={t} className={`pill${type===t?" on":""}`} onClick={()=>setType(t)}>{t}</button>)}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:"1.5px solid var(--lg)",borderRadius:20,padding:"8px 14px",fontSize:13,fontWeight:600,fontFamily:"'Sora',sans-serif",background:"#fff",cursor:"pointer",outline:"none"}}>
            <option value="default">Sort: Default</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* Filter toggle */}
          <button onClick={()=>setShowFilters(v=>!v)} className="btn gh" style={{fontSize:13,padding:"8px 16px",gap:6,background:showFilters?"var(--dark)":"#fff",color:showFilters?"#fff":"var(--dark)"}}>
            ⚙️ Filters {showFilters?"▲":"▼"}
          </button>

          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:"var(--green)",flexShrink:0}}>
            <span className="dot"/>{filtered.length} stays
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="fu" style={{marginTop:14,padding:"18px 0",borderTop:"1px solid var(--lg)",display:"flex",gap:32,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:240}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--gray)",marginBottom:8}}>MAX PRICE PER NIGHT</div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <input type="range" min={1000} max={15000} step={500} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}
                  style={{flex:1,accentColor:"var(--red)",height:4,cursor:"pointer"}}/>
                <span style={{fontWeight:800,fontSize:15,color:"var(--red)",minWidth:80}}>Rs.{maxPrice.toLocaleString()}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--gray)",marginTop:4}}>
                <span>Rs.1,000</span><span>Rs.15,000</span>
              </div>
            </div>
            <button onClick={()=>{setMaxPrice(15000);setSortBy("default");setType("All");setQ("");setDestFilter(null);}} className="btn gh" style={{fontSize:13,padding:"8px 16px"}}>
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* ── LISTINGS GRID ── */}
      <div style={{maxWidth:1380,margin:"0 auto",padding:"32px 36px 72px"}}>
        {destFilter&&(
          <div style={{marginBottom:24,display:"flex",alignItems:"center",gap:10}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700}}>Stays in {destFilter}</h3>
            <button onClick={()=>{setDestFilter(null);setQ("");}} style={{background:"var(--lg)",border:"none",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--gray)"}}>✕ Clear</button>
          </div>
        )}
        {loading?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:28}}>
            {Array(8).fill(0).map((_,i)=><div key={i}><div className="sk" style={{height:220,marginBottom:12}}/><div className="sk" style={{height:16,width:"70%",marginBottom:8}}/><div className="sk" style={{height:13,width:"50%"}}/></div>)}
          </div>
        ):filtered.length===0?(
          <div style={{textAlign:"center",padding:"80px 0",color:"var(--gray)"}}>
            <div style={{fontSize:52,marginBottom:16}}>🔍</div>
            <h3 style={{fontSize:22,fontWeight:700,marginBottom:8}}>No matches found</h3>
            <p>Try adjusting your price range, filters, or search term</p>
            <button className="btn dk" style={{marginTop:20}} onClick={()=>{setType("All");setQ("");setDestFilter(null);setMaxPrice(15000);setSortBy("default");}}>Clear all filters</button>
          </div>
        ):(
          <>
            {isHost && (
              <div style={{marginBottom:18,display:"inline-flex",alignItems:"center",gap:7,background:"#fff7ed",border:"1.5px solid #fed7aa",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,color:"#92400e"}}>
                ✏️ Host Mode · Click <b style={{color:"var(--red)"}}>Edit</b> on any listing card to update its details
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:28}}>
              {filtered.map((l,i)=>(
                <Card
                  key={l._id}
                  l={l}
                  delay={i}
                  onClick={()=>{setL(l);setPage("detail");}}
                  isHost={isHost}
                  onEdit={isHost ? (listing)=>setEditTarget(listing) : null}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {editTarget && (
        <ListingEditModal
          listing={editTarget}
          onSave={handleListingEdit}
          onClose={()=>setEditTarget(null)}
        />
      )}
    </div>
  );
}

/* =============================================
   DETAIL PAGE
============================================= */
function Detail({ l: _l, setPage }) {
  const { user } = useAuth();
  const leaflet = useLeaflet();
  // Always use latest version from LISTINGS_STORE so host edits show live
  const [liveListings, setLiveListings] = useState(()=>LISTINGS_STORE.getAll());
  useEffect(()=>LISTINGS_STORE.subscribe(data=>setLiveListings([...data])),[]);
  const l = liveListings.find(x=>x._id===_l._id) || _l;
  const [liked, setLiked] = useState(false);
  const [photos, setPhotos] = useState(false);
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const fb = "https://picsum.photos/seed/fallback800/800/600";
  const nights = checkin&&checkout?Math.max(0,Math.round((new Date(checkout)-new Date(checkin))/86400000)):0;
  const sub=nights*l.price, fee=Math.round(sub*.12), total=sub+fee;

  const book = async()=>{
    if(!user){setPage("login");return;}
    if(!checkin||!checkout||nights<1){alert("Please select valid dates");return;}
    setBooking(true);
    await new Promise(r=>setTimeout(r,1400));
    // Save to real bookings store
    const newBooking = {
      _id: "bk_"+Date.now(),
      listing: l,
      listingId: l._id,
      checkIn: checkin,
      checkOut: checkout,
      guests,
      total,
      status: "confirmed",
      bookedAt: new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),
      customerName: user.name,
      customerEmail: user.email,
      customerAvatar: user.avatar,
    };
    BOOKINGS_STORE.add(newBooking);

    // ── Customer notification: booking success ──
    NOTIFS_STORE.push({
      for: user.email,
      icon: "🎉",
      title: "Booking Confirmed!",
      msg: `Your stay at "${l.title}" is confirmed! Check-in: ${checkin} → Check-out: ${checkout}. ${guests} guest${guests>1?"s":""}. Total: Rs.${total.toLocaleString()}.`,
      booking: newBooking,
    });

    // ── Host notification: new booking alert with full customer + property details ──
    NOTIFS_STORE.push({
      for: "host",
      icon: "🏠",
      title: "New Booking Received!",
      msg: `${user.name} just booked "${l.title}" (${l.location}). Check-in: ${checkin} → Check-out: ${checkout}. ${guests} guest${guests>1?"s":""}. Total: Rs.${total.toLocaleString()}.`,
      booking: newBooking,
      customerInfo: { name: user.name, email: user.email, avatar: user.avatar },
      listingInfo: { title: l.title, location: l.location, image: l.images[0] },
    });

    setBooked(true);
    setBooking(false);
  };

  if(booked) return (
    <div style={{maxWidth:540,margin:"60px auto",padding:"40px 32px"}} className="fu">
      {/* Success header */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:88,height:88,borderRadius:"50%",background:"linear-gradient(135deg,#d1fae5,#a7f3d0)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:42,boxShadow:"0 8px 28px rgba(16,185,129,.2)"}}>✅</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:34,marginBottom:8}}>Booking Confirmed!</h2>
        <p style={{color:"var(--gray)",fontSize:15,lineHeight:1.6}}>Your stay has been successfully booked.<br/>A confirmation has been sent to your notifications.</p>
      </div>

      {/* Property + dates summary */}
      <div style={{borderRadius:20,overflow:"hidden",border:"1.5px solid var(--lg)",marginBottom:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
        <img src={l.images[0]} alt={l.title} style={{width:"100%",height:160,objectFit:"cover"}} onError={e=>e.target.src="https://picsum.photos/seed/fallback/600/300"}/>
        <div style={{padding:"18px 22px"}}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>{l.title}</div>
          <div style={{color:"var(--gray)",fontSize:13,display:"flex",alignItems:"center",gap:4,marginBottom:14}}><I.Pin/>{l.location}</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {[["📅 Check-in",checkin],["📅 Check-out",checkout],["👥 Guests",`${guests} guest${guests>1?"s":""}`]].map(([lbl,val])=>(
              <div key={lbl}><div style={{fontSize:10,fontWeight:800,color:"var(--gray)",letterSpacing:".04em"}}>{lbl}</div><div style={{fontWeight:700,fontSize:13,marginTop:2}}>{val}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <div style={{background:"var(--bg)",borderRadius:16,padding:"18px 22px",marginBottom:20}}>
        {[["Accommodation",`Rs.${l.price.toLocaleString()} × ${nights} night${nights>1?"s":""}`,`Rs.${sub.toLocaleString()}`],["Service fee (12%)","",`Rs.${fee.toLocaleString()}`]].map(([a,b,c])=>(
          <div key={a} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:"var(--gray)"}}><span>{a} {b}</span><span>{c}</span></div>
        ))}
        <div style={{borderTop:"1px solid var(--lg)",paddingTop:12,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:18,marginTop:4}}><span>Total Paid</span><span style={{color:"var(--red)"}}>Rs.{total.toLocaleString()}</span></div>
      </div>

      {/* Notification hint */}
      <div style={{background:"#fff8f0",border:"1.5px solid #fed7aa",borderRadius:14,padding:"14px 18px",marginBottom:24,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:24,flexShrink:0}}>🔔</span>
        <div style={{fontSize:13,color:"#92400e",lineHeight:1.5}}>
          <b>Booking confirmation sent!</b> Check your <button onClick={()=>setPage("notifications")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)",fontWeight:800,fontSize:13,textDecoration:"underline",fontFamily:"'Sora',sans-serif",padding:0}}>notifications</button> for full details of your stay.
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button className="btn r" style={{width:"100%"}} onClick={()=>setPage("bookings")}>📅 View My Bookings</button>
        <button className="btn gh" style={{width:"100%"}} onClick={()=>setPage("notifications")}>🔔 View Notification</button>
        <button className="btn gh" style={{width:"100%"}} onClick={()=>setPage("home")}>← Back to Listings</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:1140,margin:"0 auto",padding:"32px 36px"}} className="fu">
      <button className="btn gh" style={{marginBottom:20,padding:"8px 16px",gap:6,fontSize:13}} onClick={()=>setPage("home")}><I.Left/>Back</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:16}}>
        <div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,marginBottom:8,lineHeight:1.2}}>{l.title}</h1>
          <div style={{display:"flex",alignItems:"center",gap:14,color:"var(--gray)",fontSize:14,flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:4}}><I.Star/><b style={{color:"var(--dark)"}}>{l.rating}</b> · <u style={{cursor:"pointer"}}>{l.reviews} reviews</u></span>
            {l.host.superhost&&<span style={{color:"#d97706",fontWeight:700}}>⭐ Superhost</span>}
            <span style={{display:"flex",alignItems:"center",gap:4}}><I.Pin/>{l.location}</span>
          </div>
        </div>
        <button onClick={()=>setLiked(v=>!v)} className="btn gh" style={{padding:"9px 16px",gap:6,fontSize:13,color:liked?"var(--red)":"inherit"}}><I.Heart on={liked}/>{liked?"Saved":"Save"}</button>
      </div>

      {/* 5-panel photo grid: 1 large left + 4 small right */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"240px 240px",gap:8,height:488,borderRadius:20,overflow:"hidden",marginBottom:36,position:"relative"}}>
        {/* Main large image */}
        <div style={{gridRow:"1/3",overflow:"hidden",position:"relative"}}>
          <img src={l.images[0]} onError={e=>e.target.src=fb} alt={l.title} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s"}} onMouseEnter={e=>e.target.style.transform="scale(1.04)"} onMouseLeave={e=>e.target.style.transform="none"}/>
        </div>
        {/* 4 small images */}
        {[1,2,3,4].map(i=>(
          <div key={i} style={{overflow:"hidden",position:"relative"}}>
            <img src={l.images[i]||l.images[0]} onError={e=>e.target.src=fb} alt="" style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s"}} onMouseEnter={e=>e.target.style.transform="scale(1.06)"} onMouseLeave={e=>e.target.style.transform="none"}/>
            {i===4&&(
              <button onClick={()=>setPhotos(true)} style={{position:"absolute",bottom:14,right:14,background:"rgba(255,255,255,.95)",border:"1.5px solid var(--dark)",borderRadius:10,padding:"8px 18px",fontWeight:700,fontSize:13,cursor:"pointer",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",gap:7,boxShadow:"0 2px 12px rgba(0,0,0,.15)"}}>
                📷 Show all {l.images.length} photos
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:52}}>
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:26,borderBottom:"1px solid var(--lg)",marginBottom:26}}>
            <div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:4}}>Hosted by {l.host.name}</h2>
              <div style={{color:"var(--gray)",fontSize:13,display:"flex",gap:10}}><span>{l.bedrooms} beds</span>·<span>{l.bathrooms} baths</span>·<span>Up to {l.maxGuests} guests</span></div>
            </div>
            <img src={l.host.avatar} onError={e=>e.target.src=`https://ui-avatars.com/api/?name=${l.host.name}`} alt={l.host.name} style={{width:58,height:58,borderRadius:"50%",objectFit:"cover",border:"3px solid #fff",boxShadow:"0 2px 12px rgba(0,0,0,.12)"}}/>
          </div>
          {[["⭐",l.host.superhost?"Superhost":"Experienced host",`${l.host.name} has been hosting since ${l.host.joined}`],["📍","Prime location","95% of recent guests rated the location 5 stars"],["🔑","Seamless check-in","100% of guests gave check-in 5 stars"]].map(([ic,t,s])=>(
            <div key={t} style={{display:"flex",gap:16,marginBottom:22}}><span style={{fontSize:24,flexShrink:0}}>{ic}</span><div><div style={{fontWeight:700,marginBottom:3}}>{t}</div><div style={{color:"var(--gray)",fontSize:13}}>{s}</div></div></div>
          ))}
          <div style={{borderTop:"1px solid var(--lg)",margin:"24px 0"}}/>
          <p style={{lineHeight:1.8,fontSize:15,color:"#444",marginBottom:28}}>{l.description}</p>
          <div style={{borderTop:"1px solid var(--lg)",margin:"24px 0"}}/>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:16}}>What this place offers</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",marginBottom:28}}>
            {l.amenities.map(a=>(
              <div key={a} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",borderBottom:"1px solid var(--lg)"}}><span style={{fontSize:20}}>{AICONS[a]||"✅"}</span><span style={{fontSize:14,fontWeight:500}}>{a}</span></div>
            ))}
          </div>
          <div style={{borderTop:"1px solid var(--lg)",paddingTop:28,marginBottom:28}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:6}}>Where you'll be</h3>
            <div style={{display:"flex",alignItems:"center",gap:8,color:"var(--gray)",fontSize:14,marginBottom:16}}><I.Pin/>{l.location}<span style={{display:"inline-flex",alignItems:"center",gap:5,marginLeft:6,background:"#d1fae5",color:"#065f46",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}><span className="dot"/>Live map</span></div>
            {leaflet?(<div className="mwrap" style={{height:380,border:"1px solid var(--lg)"}}><MapView lat={l.lat} lng={l.lng} title={l.title} zoom={14}/></div>):(<div style={{height:380,background:"var(--bg)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--gray)"}}>Loading map…</div>)}
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:6}}>
              {l.nearby.map(p=><div key={p} style={{display:"flex",alignItems:"center",gap:8,fontSize:14,color:"var(--gray)",fontWeight:500}}><I.Pin/>{p}</div>)}
            </div>
          </div>

          {/* ── REVIEWS SECTION ── */}
          <ReviewsSection listingId={l._id} rating={l.rating} totalReviews={l.reviews} user={user}/>
        </div>
        <div>
          <div style={{background:"#fff",border:"1.5px solid var(--lg)",borderRadius:24,padding:28,position:"sticky",top:90,boxShadow:"var(--sh2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:20}}><div><span style={{fontSize:24,fontWeight:800}}>Rs.{l.price.toLocaleString()}</span><span style={{color:"var(--gray)",fontSize:15}}> / night</span></div><div style={{display:"flex",alignItems:"center",gap:4,fontSize:13}}><I.Star/><b>{l.rating}</b><span style={{color:"var(--gray)"}}>({l.reviews})</span></div></div>
            <div style={{border:"1.5px solid var(--lg)",borderRadius:14,marginBottom:12,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1px solid var(--lg)"}}>
                <div style={{padding:"13px 16px",borderRight:"1px solid var(--lg)"}}><div style={{fontSize:10,fontWeight:800,letterSpacing:".07em",marginBottom:4}}>CHECK-IN</div><input type="date" value={checkin} onChange={e=>setCheckin(e.target.value)} style={{border:"none",fontSize:13,fontWeight:600,background:"transparent",width:"100%"}}/></div>
                <div style={{padding:"13px 16px"}}><div style={{fontSize:10,fontWeight:800,letterSpacing:".07em",marginBottom:4}}>CHECKOUT</div><input type="date" value={checkout} onChange={e=>setCheckout(e.target.value)} style={{border:"none",fontSize:13,fontWeight:600,background:"transparent",width:"100%"}}/></div>
              </div>
              <div style={{padding:"13px 16px"}}><div style={{fontSize:10,fontWeight:800,letterSpacing:".07em",marginBottom:4}}>GUESTS</div><select value={guests} onChange={e=>setGuests(Number(e.target.value))} style={{border:"none",fontSize:14,fontWeight:600,background:"transparent",width:"100%"}}>{Array.from({length:l.maxGuests},(_,i)=><option key={i+1} value={i+1}>{i+1} guest{i>0?"s":""}</option>)}</select></div>
            </div>
            <button className="btn r" style={{width:"100%",fontSize:16,padding:16,borderRadius:14,marginBottom:14,opacity:booking?.7:1}} onClick={book} disabled={booking}>{booking?"Confirming…":user?"Reserve":"Sign in to Reserve"}</button>
            <p style={{textAlign:"center",color:"var(--gray)",fontSize:13,marginBottom:nights>0?16:0}}>You won't be charged yet</p>
            {nights>0&&(<div className="fu"><div style={{display:"flex",justifyContent:"space-between",fontSize:14,color:"var(--gray)",marginBottom:8}}><u>Rs.{l.price.toLocaleString()} x {nights} nights</u><span>Rs.{sub.toLocaleString()}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:14,color:"var(--gray)",marginBottom:14}}><u>Service fee</u><span>Rs.{fee.toLocaleString()}</span></div><div style={{borderTop:"1px solid var(--lg)",paddingTop:14,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16}}><span>Total</span><span>Rs.{total.toLocaleString()}</span></div></div>)}
            <div style={{marginTop:20,background:"var(--bg)",borderRadius:12,padding:"14px 16px",display:"flex",gap:10,alignItems:"flex-start",fontSize:13,color:"var(--gray)"}}><I.Shield/><span><b style={{color:"var(--dark)"}}>StayBnb Guarantee</b> — If something's wrong, we'll make it right.</span></div>
          </div>
        </div>
      </div>
      {photos&&(
        <div className="modal" onClick={()=>setPhotos(false)}>
          <div className="mbox" onClick={e=>e.stopPropagation()} style={{maxWidth:900,padding:"32px 36px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:4}}>{l.title}</h3>
                <p style={{color:"var(--gray)",fontSize:13,display:"flex",alignItems:"center",gap:5}}><I.Pin/>{l.location} · {l.images.length} photos</p>
              </div>
              <button className="btn gh" style={{padding:"8px 14px",gap:6}} onClick={()=>setPhotos(false)}><I.X/> Close</button>
            </div>
            {/* Hero large image */}
            <img src={l.images[0]} onError={e=>e.target.src=fb} alt={l.title} style={{width:"100%",height:360,objectFit:"cover",borderRadius:16,marginBottom:8}}/>
            {/* Row of 3 */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
              {[1,2,3].map(i=><img key={i} src={l.images[i]||l.images[0]} onError={e=>e.target.src=fb} alt="" style={{width:"100%",height:200,objectFit:"cover",borderRadius:12}}/>)}
            </div>
            {/* Row of remaining images */}
            {l.images.length > 4 && (
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(l.images.length-4,4)},1fr)`,gap:8}}>
                {l.images.slice(4).map((img,i)=><img key={i} src={img} onError={e=>e.target.src=fb} alt="" style={{width:"100%",height:180,objectFit:"cover",borderRadius:12}}/>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================
   EXPLORE PAGE
============================================= */
/* =============================================
   REVIEWS SECTION  (in detail page)
============================================= */
function StarRow({ val }) {
  return (
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(n=>(
        <svg key={n} viewBox="0 0 24 24" fill={n<=val?"#FF385C":"#e5e7eb"} style={{width:14,height:14}}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewsSection({ listingId, rating, totalReviews, user }) {
  const reviews = REVIEWS_DATA[listingId] || DEFAULT_REVIEWS;
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const [hoverStar, setHoverStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);
  const shown = showAll ? localReviews : localReviews.slice(0, 3);

  const ratingBreakdown = [
    { label:"Cleanliness", val:4.9 }, { label:"Accuracy", val:4.8 },
    { label:"Check-in", val:5.0 }, { label:"Communication", val:4.9 },
    { label:"Location", val:4.8 }, { label:"Value", val:4.7 },
  ];

  const [submitting, setSubmitting] = useState(false);
  const [hostReply, setHostReply] = useState("");

  const submit = async () => {
    if (!newText.trim()) return;
    setSubmitting(true);
    const r = { id:"u"+Date.now(), name:user?.name||"Anonymous", avatar:user?.avatar||`https://ui-avatars.com/api/?name=User&background=FF385C&color=fff&bold=true`, date:"Just now", rating:newRating, text:newText };
    setLocalReviews(v=>[r,...v]);
    setShowForm(false);
    // AI generates a host thank-you reply
    try {
      const reply = await callClaude(
        `A guest named "${user?.name||"a traveller"}" just left a ${newRating}-star review saying: "${newText}". 
         Write a warm, genuine 1-2 sentence thank-you response from the host. 
         Mention the rating and invite them to return. Keep it under 35 words. Be personal and heartfelt.`,
        "You are a warm Indian host responding to a guest review on StayBnb. Keep replies short, genuine, and hospitable."
      );
      setHostReply(reply);
    } catch { setHostReply("Thank you so much for your wonderful review! 🙏 We hope to welcome you back very soon."); }
    setNewText(""); setNewRating(5);
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(()=>{ setSubmitted(false); setHostReply(""); }, 8000);
  };

  return (
    <div style={{borderTop:"1px solid var(--lg)",paddingTop:32,marginBottom:8}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <I.Star/>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700}}>{rating}</span>
          </div>
          <span style={{color:"var(--gray)",fontSize:15}}>·</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,textDecoration:"underline",cursor:"pointer"}}>{localReviews.length} reviews</span>
        </div>
        {user && !showForm && (
          <button onClick={()=>setShowForm(true)} className="btn gh" style={{fontSize:13,padding:"9px 18px",gap:6}}>
            ✏️ Write a review
          </button>
        )}
      </div>

      {/* Rating breakdown grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 32px",marginBottom:28,padding:"20px 24px",background:"var(--bg)",borderRadius:16}}>
        {ratingBreakdown.map(rb=>(
          <div key={rb.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--dark)",minWidth:100}}>{rb.label}</span>
            <div style={{flex:1,height:3,background:"var(--lg)",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${(rb.val/5)*100}%`,height:"100%",background:"var(--dark)",borderRadius:4,transition:"width 1s"}}/>
            </div>
            <span style={{fontSize:13,fontWeight:700,minWidth:28,textAlign:"right"}}>{rb.val}</span>
          </div>
        ))}
      </div>

      {/* Write review form */}
      {showForm && (
        <div className="fu" style={{background:"var(--bg)",borderRadius:18,padding:"24px",marginBottom:24,border:"1.5px solid var(--lg)"}}>
          <h4 style={{fontWeight:700,fontSize:16,marginBottom:16}}>Share your experience</h4>
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setNewRating(n)} onMouseEnter={()=>setHoverStar(n)} onMouseLeave={()=>setHoverStar(0)}
                style={{background:"none",border:"none",cursor:"pointer",padding:"2px",transition:"transform .15s"}}
                onMouseDown={e=>e.currentTarget.style.transform="scale(1.3)"}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                <svg viewBox="0 0 24 24" fill={n<=(hoverStar||newRating)?"#FF385C":"#d1d5db"} style={{width:28,height:28,transition:"fill .15s"}}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>
            ))}
            <span style={{marginLeft:8,fontSize:14,fontWeight:600,color:"var(--gray)",alignSelf:"center"}}>
              {["","Terrible","Poor","OK","Good","Excellent"][newRating]}
            </span>
          </div>
          <textarea value={newText} onChange={e=>setNewText(e.target.value)} placeholder="Tell future guests about your stay — what made it special, any tips..." style={{width:"100%",minHeight:100,padding:"13px 16px",border:"1.5px solid var(--lg)",borderRadius:12,fontSize:14,resize:"vertical",fontFamily:"'Sora',sans-serif",outline:"none",lineHeight:1.6,marginBottom:14}}/>
          <div style={{display:"flex",gap:10}}>
            <button className="btn r" onClick={submit} disabled={submitting} style={{padding:"10px 24px",fontSize:14,opacity:submitting?.7:1,display:"flex",alignItems:"center",gap:8}}>
              {submitting&&<div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>}
              {submitting?"Submitting…":"Submit Review"}
            </button>
            <button className="btn gh" onClick={()=>{setShowForm(false);setNewText("");}} style={{padding:"10px 24px",fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="fu" style={{background:"#d1fae5",borderRadius:14,padding:"16px 20px",marginBottom:20,border:"1px solid #a7f3d0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:hostReply?10:0}}>
            <span style={{fontSize:20}}>✅</span>
            <span style={{fontSize:14,fontWeight:700,color:"#065f46"}}>Your review has been posted! Thank you.</span>
          </div>
          {hostReply && (
            <div style={{background:"rgba(255,255,255,.7)",borderRadius:10,padding:"12px 14px",borderLeft:"3px solid #059669"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#059669",letterSpacing:".06em",marginBottom:5}}>🏠 HOST RESPONSE (AI-generated)</div>
              <p style={{fontSize:13,color:"#065f46",lineHeight:1.6,fontStyle:"italic"}}>{hostReply}</p>
            </div>
          )}
        </div>
      )}

      {/* Review cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        {shown.map(r=>(
          <div key={r.id} className="fu" style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <img src={r.avatar} alt={r.name} onError={e=>e.target.src=`https://ui-avatars.com/api/?name=${r.name}`}
                style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid var(--lg)"}}/>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{r.name}</div>
                <div style={{color:"var(--gray)",fontSize:12,marginTop:1}}>{r.date}</div>
              </div>
            </div>
            <StarRow val={r.rating}/>
            <p style={{fontSize:14,lineHeight:1.65,color:"#333"}}>{r.text}</p>
          </div>
        ))}
      </div>

      {localReviews.length > 3 && (
        <button onClick={()=>setShowAll(v=>!v)} className="btn gh" style={{marginTop:24,fontSize:14,padding:"11px 24px",gap:6}}>
          {showAll ? "▲ Show less" : `▼ Show all ${localReviews.length} reviews`}
        </button>
      )}
    </div>
  );
}

/* =============================================
   WISHLIST PAGE
============================================= */
function WishlistPage({ setPage, setL }) {
  const { user } = useAuth();
  const [storeListings, setStoreListings] = useState(()=>LISTINGS_STORE.getAll());
  useEffect(()=>LISTINGS_STORE.subscribe(data=>setStoreListings([...data])),[]);
  const [liked] = useState(()=>LISTINGS_STORE.getAll().slice(0, 6)); // mock saved items
  // Get live versions of wishlisted items
  const livedLiked = liked.map(l => storeListings.find(x=>x._id===l._id)||l);

  if (!user) return (
    <div style={{textAlign:"center",padding:"80px 32px"}}>
      <div style={{fontSize:52,marginBottom:16}}>❤️</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,marginBottom:12}}>Sign in to see your wishlists</h2>
      <p style={{color:"var(--gray)",marginBottom:24}}>Save your favourite stays and come back anytime</p>
      <button className="btn r" onClick={()=>setPage("login")}>Sign In</button>
    </div>
  );
  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"40px 36px"}} className="fu">
      <div style={{marginBottom:32}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,marginBottom:6}}>Your Wishlist ❤️</h1>
        <p style={{color:"var(--gray)",fontSize:15}}>{livedLiked.length} saved stays</p>
      </div>
      {liked.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 0",color:"var(--gray)"}}>
          <div style={{fontSize:52,marginBottom:16}}>🔍</div>
          <h3 style={{fontSize:22,fontWeight:700,marginBottom:8}}>Nothing saved yet</h3>
          <p>Tap the ❤️ on any listing to save it here</p>
          <button className="btn dk" style={{marginTop:20}} onClick={()=>setPage("home")}>Explore Stays</button>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:28}}>
          {livedLiked.map((l,i)=>(
            <div key={l._id} style={{position:"relative"}}>
              <Card l={{...l,host:{...l.host,superhost:l.host.superhost}}} delay={i} onClick={()=>{setL(l);setPage("detail");}}/>
              <div style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.92)",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,backdropFilter:"blur(4px)",color:"var(--red)"}}>❤️ Saved</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =============================================
   PROFILE PAGE
============================================= */
function ProfilePage({ setPage }) {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name:user?.name||"", email:user?.email||"", phone:"", bio:"Travel enthusiast exploring India one stay at a time ✈️", location:"Hyderabad, India" });
  const [saved, setSaved] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar||"");
  const [avatarTab, setAvatarTab] = useState("url"); // "url" | "upload"
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  if (!user) return (
    <div style={{textAlign:"center",padding:"80px"}}><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:16}}>Sign in required</h2><button className="btn r" onClick={()=>setPage("login")}>Sign In</button></div>
  );

  const save = () => {
    login({ ...user, name:form.name, email:form.email });
    setEditing(false); setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const applyAvatar = () => {
    if(!avatarPreview) return;
    login({ ...user, avatar: avatarPreview });
    setAvatarModal(false);
    setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const fi = { width:"100%", padding:"12px 16px", border:"1.5px solid var(--lg)", borderRadius:12, fontSize:14, fontWeight:500, fontFamily:"'Sora',sans-serif", outline:"none" };

  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"40px 36px"}} className="fu">
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,marginBottom:32}}>Your Profile</h1>

      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:40}}>
        {/* Left — avatar card */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{position:"relative"}}>
            <img
              src={user.avatar}
              alt={user.name}
              style={{width:120,height:120,borderRadius:"50%",objectFit:"cover",border:"4px solid #fff",boxShadow:"var(--sh2)"}}
              onError={e=>e.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FF385C&color=fff&bold=true&size=128`}
            />
            <button
              onClick={()=>{ setAvatarUrl(""); setAvatarPreview(user.avatar); setAvatarTab("url"); setAvatarModal(true); }}
              style={{position:"absolute",bottom:4,right:4,width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#FF385C,#ff6b35)",border:"3px solid #fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,boxShadow:"0 2px 8px rgba(255,56,92,.4)",transition:"transform .15s"}}
              title="Change profile photo"
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            >✏️</button>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:3}}>{user.name}</div>
            <div style={{color:"var(--gray)",fontSize:13}}>{user.role==="host"?"🏠 Host Admin":"👤 StayBnb member"}</div>
            <button
              onClick={()=>{ setAvatarUrl(""); setAvatarPreview(user.avatar); setAvatarTab("url"); setAvatarModal(true); }}
              style={{marginTop:10,padding:"6px 16px",borderRadius:20,border:"1.5px solid var(--red)",background:"#fff0f3",color:"var(--red)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--red)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#fff0f3";e.currentTarget.style.color="var(--red)";}}
            >📷 Change Photo</button>
          </div>

          {/* Trust badges */}
          <div style={{width:"100%",background:"var(--bg)",borderRadius:16,padding:"18px 20px"}}>
            <div style={{fontSize:13,fontWeight:800,marginBottom:12,letterSpacing:".04em"}}>TRUST & VERIFICATION</div>
            {[["✅","Identity verified"],["📧","Email confirmed"],["📱","Phone confirmed"],["⭐","Superhost eligible"]].map(([ic,lbl])=>(
              <div key={lbl} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,fontSize:13,fontWeight:500,color:lbl.includes("eligible")?"var(--gray)":"var(--dark)"}}>
                <span>{ic}</span>{lbl}
              </div>
            ))}
          </div>
          {/* Stats */}
          <div style={{width:"100%",background:"linear-gradient(135deg,#FF385C15,#ff6b3510)",borderRadius:16,padding:"18px 20px",border:"1px solid #FF385C30"}}>
            <div style={{fontSize:13,fontWeight:800,marginBottom:12,letterSpacing:".04em",color:"var(--red)"}}>YOUR STATS</div>
            {[["🗺️","12 trips taken"],["⭐","4.9 avg rating"],["❤️","6 wishlist saves"],["🏠","3 listings hosted"]].map(([ic,lbl])=>(
              <div key={lbl} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,fontSize:13,fontWeight:600}}><span>{ic}</span>{lbl}</div>
            ))}
          </div>
        </div>

        {/* Right — edit form */}
        <div>
          {saved && (
            <div className="fu" style={{background:"#d1fae5",borderRadius:12,padding:"12px 18px",marginBottom:20,fontSize:14,fontWeight:600,color:"#065f46",display:"flex",alignItems:"center",gap:8}}>
              ✅ Profile updated successfully!
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22}}>Personal Info</h2>
            {!editing
              ? <button className="btn gh" style={{fontSize:13,padding:"9px 18px"}} onClick={()=>setEditing(true)}>Edit profile</button>
              : <div style={{display:"flex",gap:8}}><button className="btn r" style={{fontSize:13,padding:"9px 18px"}} onClick={save}>Save changes</button><button className="btn gh" style={{fontSize:13,padding:"9px 18px"}} onClick={()=>setEditing(false)}>Cancel</button></div>
            }
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {[
              ["Full Name","name","text","Your full name"],
              ["Email Address","email","email","Your email address"],
              ["Phone Number","phone","tel","+91 XXXXX XXXXX"],
            ].map(([label,key,type,ph])=>(
              <div key={key}>
                <label style={{display:"block",fontSize:12,fontWeight:800,letterSpacing:".06em",color:"var(--gray)",marginBottom:6,textTransform:"uppercase"}}>{label}</label>
                {editing
                  ? <input type={type} style={fi} value={form[key]} placeholder={ph} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>
                  : <div style={{fontSize:15,fontWeight:500,padding:"12px 0",borderBottom:"1px solid var(--lg)",color:form[key]||"var(--gray)"}}>{form[key]||<span style={{color:"var(--gray)",fontStyle:"italic"}}>Not added</span>}</div>
                }
              </div>
            ))}
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:800,letterSpacing:".06em",color:"var(--gray)",marginBottom:6,textTransform:"uppercase"}}>About You</label>
              {editing
                ? <textarea style={{...fi,minHeight:100,resize:"vertical"}} value={form.bio} placeholder="Tell other hosts about yourself…" onChange={e=>setForm(v=>({...v,bio:e.target.value}))} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>
                : <div style={{fontSize:15,fontWeight:500,padding:"12px 0",borderBottom:"1px solid var(--lg)",lineHeight:1.6}}>{form.bio}</div>
              }
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:800,letterSpacing:".06em",color:"var(--gray)",marginBottom:6,textTransform:"uppercase"}}>Lives In</label>
              {editing
                ? <input style={fi} value={form.location} placeholder="Your city, country" onChange={e=>setForm(v=>({...v,location:e.target.value}))} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/>
                : <div style={{fontSize:15,fontWeight:500,padding:"12px 0",borderBottom:"1px solid var(--lg)"}}>{form.location}</div>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── AVATAR CHANGE MODAL ── */}
      {avatarModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setAvatarModal(false)}>
          <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:460,boxShadow:"0 28px 90px rgba(0,0,0,.25)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid var(--lg)",background:"linear-gradient(135deg,#fff0f2,#fff8f5)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:"var(--red)",letterSpacing:".08em",marginBottom:3}}>📷 CHANGE PROFILE PHOTO</div>
                <div style={{fontWeight:800,fontSize:16,fontFamily:"'Playfair Display',serif"}}>Update Your Picture</div>
              </div>
              <button onClick={()=>setAvatarModal(false)} style={{width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--lg)",background:"#f8f8f8",cursor:"pointer",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>

            <div style={{padding:"20px 24px 24px"}}>
              {/* Live preview */}
              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <div style={{position:"relative"}}>
                  <img
                    src={avatarPreview}
                    alt="preview"
                    style={{width:90,height:90,borderRadius:"50%",objectFit:"cover",border:"3px solid var(--red)",boxShadow:"0 4px 18px rgba(255,56,92,.2)"}}
                    onError={e=>e.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FF385C&color=fff&bold=true&size=128`}
                  />
                  <div style={{position:"absolute",bottom:2,right:2,width:22,height:22,borderRadius:"50%",background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,border:"2px solid #fff"}}>✓</div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{display:"flex",gap:4,background:"#f3f4f6",borderRadius:12,padding:4,marginBottom:18}}>
                {[["url","🔗 Image URL"],["upload","📁 Upload File"]].map(([k,lbl])=>(
                  <button key={k} onClick={()=>setAvatarTab(k)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .2s",background:avatarTab===k?"#fff":"transparent",color:avatarTab===k?"var(--red)":"#6b7280",boxShadow:avatarTab===k?"0 2px 8px rgba(0,0,0,.1)":"none"}}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* URL tab */}
              {avatarTab==="url" && (
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:6}}>PASTE IMAGE URL</label>
                  <input
                    value={avatarUrl}
                    onChange={e=>{setAvatarUrl(e.target.value);setAvatarPreview(e.target.value);}}
                    placeholder="https://example.com/your-photo.jpg"
                    style={{width:"100%",padding:"12px 14px",border:"1.5px solid var(--lg)",borderRadius:11,fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",background:"#fafafa",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor="var(--red)"}
                    onBlur={e=>e.target.style.borderColor="var(--lg)"}
                  />
                  <div style={{fontSize:11,color:"var(--gray)",marginTop:6}}>Paste any direct image link — JPG, PNG, WebP supported</div>
                </div>
              )}

              {/* Upload tab */}
              {avatarTab==="upload" && (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileUpload}/>
                  <div
                    onClick={()=>fileRef.current?.click()}
                    style={{border:"2px dashed var(--red)",borderRadius:14,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:"#fff8f8",transition:"background .2s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#fff0f3"}
                    onMouseLeave={e=>e.currentTarget.style.background="#fff8f8"}
                  >
                    {uploading ? (
                      <div style={{color:"var(--gray)",fontSize:13}}>
                        <div style={{width:24,height:24,border:"2px solid var(--lg)",borderTopColor:"var(--red)",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 10px"}}/>
                        Processing image…
                      </div>
                    ) : (
                      <>
                        <div style={{fontSize:36,marginBottom:10}}>📁</div>
                        <div style={{fontWeight:700,fontSize:14,color:"var(--dark)",marginBottom:4}}>Click to choose a photo</div>
                        <div style={{fontSize:12,color:"var(--gray)"}}>JPG, PNG, WebP · Max 5MB</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Quick avatar suggestions */}
              <div style={{marginTop:16}}>
                <div style={{fontSize:11,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:8}}>QUICK PICKS</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FF385C&color=fff&bold=true&size=128`,
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&bold=true&size=128`,
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&bold=true&size=128`,
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f59e0b&color=fff&bold=true&size=128`,
                    `https://randomuser.me/api/portraits/men/32.jpg`,
                    `https://randomuser.me/api/portraits/women/44.jpg`,
                  ].map((src,i)=>(
                    <img
                      key={i}
                      src={src}
                      alt=""
                      onClick={()=>{setAvatarPreview(src);setAvatarUrl(src);setAvatarTab("url");}}
                      style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",cursor:"pointer",border:avatarPreview===src?"3px solid var(--red)":"2px solid var(--lg)",transition:"transform .15s,border .15s",flexShrink:0}}
                      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
                    />
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <button
                onClick={applyAvatar}
                style={{marginTop:20,width:"100%",padding:"13px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Sora',sans-serif",boxShadow:"0 4px 16px rgba(255,56,92,.3)",transition:"opacity .2s"}}
              >
                ✅ Apply Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================
   NOTIFICATIONS PANEL  (live, role-aware)
============================================= */
function NotificationsPage({ setPage }) {
  const { user } = useAuth();
  const [allNotifs, setAllNotifs] = useState(() => [...NOTIFS_STORE._data]);

  useEffect(() => {
    return NOTIFS_STORE.subscribe(data => setAllNotifs([...data]));
  }, []);

  if (!user) return (
    <div style={{textAlign:"center",padding:"80px"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔔</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:16}}>Sign in to see notifications</h2>
      <button className="btn r" onClick={()=>setPage("login")}>Sign In</button>
    </div>
  );

  // Re-derive from store so reads reflect
  const myNotifs = user.role==="host"
    ? allNotifs.filter(n=>n.for==="host")
    : allNotifs.filter(n=>n.for===user.email);

  const unread = myNotifs.filter(n=>!n.read).length;
  const markAll = () => { NOTIFS_STORE.markAllRead(user.role, user.email); };
  const markOne = id => { NOTIFS_STORE.markRead(id); };

  return (
    <div style={{maxWidth:700,margin:"0 auto",padding:"40px 36px"}} className="fu">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,marginBottom:6}}>
            {user.role==="host" ? "🏠 Host Notifications" : "🔔 My Notifications"}
          </h1>
          {unread>0
            ? <span style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fff0f2",color:"var(--red)",padding:"3px 12px",borderRadius:20,fontSize:12,fontWeight:700}}><span className="dot"/>{unread} unread</span>
            : <span style={{fontSize:13,color:"var(--gray)"}}>All caught up ✅</span>
          }
        </div>
        {unread>0 && <button className="btn gh" style={{fontSize:13,padding:"9px 18px"}} onClick={markAll}>Mark all as read</button>}
      </div>

      {myNotifs.length===0 ? (
        <div className="fu" style={{textAlign:"center",padding:"60px 0",color:"var(--gray)"}}>
          <div style={{fontSize:52,marginBottom:16}}>🔔</div>
          <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>No notifications yet</div>
          <div style={{fontSize:13}}>{user.role==="host" ? "You'll be alerted here when a customer makes a booking." : "Your booking confirmations and updates will appear here."}</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {myNotifs.map(n=>{
            const isHostBooking = n.for==="host" && n.customerInfo && n.booking;
            const isHostCustomer = n.for==="host" && n.customerInfo && !n.booking;
            return (
              <div
                key={n.id}
                onClick={()=>markOne(n.id)}
                style={{borderRadius:18,background:n.read?"#fff":"#fff8f0",border:n.read?"1.5px solid var(--lg)":"1.5px solid #fed7aa",boxShadow:n.read?"none":"0 2px 14px rgba(255,56,92,.08)",cursor:"pointer",transition:"all .2s",overflow:"hidden"}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.08)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow=n.read?"none":"0 2px 14px rgba(255,56,92,.08)"}
              >
                {/* Host booking alert — rich card */}
                {(isHostBooking || isHostCustomer) ? (
                  <div style={{padding:"18px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:44,height:44,borderRadius:12,background:isHostBooking?"linear-gradient(135deg,#FF385C,#ff6b35)":"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{n.icon}</div>
                        <div>
                          <div style={{fontWeight:800,fontSize:15,color:"var(--dark)"}}>{n.title}</div>
                          <div style={{fontSize:11,color:"var(--gray)",marginTop:2}}>{n.time}</div>
                        </div>
                      </div>
                      {!n.read && <div style={{width:10,height:10,borderRadius:"50%",background:"var(--red)",flexShrink:0,marginTop:4}}/>}
                    </div>

                    {/* Customer info */}
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#f0f9ff",borderRadius:14,border:"1px solid #bae6fd",marginBottom:isHostBooking?12:0}}>
                      <img src={n.customerInfo?.avatar||"https://ui-avatars.com/api/?name=Guest&background=FF385C&color=fff"} alt={n.customerInfo?.name} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",border:"2px solid #bae6fd",flexShrink:0}}/>
                      <div>
                        <div style={{fontWeight:800,fontSize:13,color:"#0369a1"}}>{n.customerInfo?.name}</div>
                        <div style={{fontSize:12,color:"#0369a1",opacity:.8}}>{n.customerInfo?.email}</div>
                      </div>
                      <span style={{marginLeft:"auto",background:isHostBooking?"#e0f2fe":"#ede9fe",color:isHostBooking?"#0369a1":"#6d28d9",padding:"3px 10px",borderRadius:10,fontSize:11,fontWeight:700,flexShrink:0}}>{isHostBooking?"Guest":"Member"}</span>
                    </div>

                    {/* Property info — only for booking notifications */}
                    {isHostBooking && (
                      <div style={{display:"flex",gap:12,marginBottom:12,background:"#fff",borderRadius:14,overflow:"hidden",border:"1px solid var(--lg)"}}>
                        <img src={n.listingInfo?.image} alt="property" style={{width:90,height:70,objectFit:"cover",flexShrink:0}} onError={e=>e.target.src="https://picsum.photos/seed/fallback/200/150"}/>
                        <div style={{padding:"10px 12px 10px 0",display:"flex",flexDirection:"column",justifyContent:"center"}}>
                          <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{n.listingInfo?.title}</div>
                          <div style={{fontSize:11,color:"var(--gray)",display:"flex",alignItems:"center",gap:4}}><I.Pin/>{n.listingInfo?.location}</div>
                        </div>
                      </div>
                    )}

                    {/* Booking details row — only for booking notifications */}
                    {isHostBooking && n.booking && (
                      <div style={{display:"flex",gap:14,flexWrap:"wrap",padding:"10px 14px",background:"var(--bg)",borderRadius:12}}>
                        {[["📅 Check-in",n.booking.checkIn],["📅 Check-out",n.booking.checkOut],["👥 Guests",`${n.booking.guests} guest${n.booking.guests>1?"s":""}`],["💰 Total",`Rs.${n.booking.total?.toLocaleString()}`]].map(([lbl,val])=>(
                          <div key={lbl}>
                            <div style={{fontSize:10,fontWeight:800,color:"var(--gray)",letterSpacing:".04em"}}>{lbl}</div>
                            <div style={{fontWeight:700,fontSize:13,marginTop:2,color:lbl.includes("💰")?"var(--red)":"var(--dark)"}}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{display:"flex",gap:8,marginTop:12}}>
                      {isHostBooking && (
                        <button onClick={e=>{e.stopPropagation();setPage("bookings");}} style={{padding:"7px 16px",borderRadius:10,border:"1.5px solid var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--red)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff0f3";e.currentTarget.style.color="var(--red);";}}>
                          📅 View Bookings
                        </button>
                      )}
                      <button onClick={e=>{e.stopPropagation();setPage("dashboard");}} style={{padding:"7px 16px",borderRadius:10,border:"1.5px solid var(--lg)",background:"#f8f8f8",color:"var(--dark)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#f8f8f8";e.currentTarget.style.color="var(--dark)";}}>
                        📊 Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Customer / simple notification */
                  <div style={{display:"flex",alignItems:"flex-start",gap:14,padding:"18px 20px"}}>
                    <div style={{width:46,height:46,borderRadius:"50%",background:n.read?"var(--bg)":"linear-gradient(135deg,#FF385C15,#ff6b3520)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,border:n.read?"1px solid var(--lg)":"1px solid #FF385C30"}}>
                      {n.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4}}>
                        <span style={{fontWeight:700,fontSize:14,color:"var(--dark)"}}>{n.title}</span>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <span style={{color:"var(--gray)",fontSize:11,whiteSpace:"nowrap"}}>{n.time}</span>
                          {!n.read && <div style={{width:8,height:8,borderRadius:"50%",background:"var(--red)",flexShrink:0}}/>}
                        </div>
                      </div>
                      <p style={{color:"var(--gray)",fontSize:13,lineHeight:1.6,margin:0}}>{n.msg}</p>
                      {n.booking && (
                        <button onClick={e=>{e.stopPropagation();setPage("bookings");}} style={{marginTop:10,padding:"6px 14px",borderRadius:9,border:"1.5px solid var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>
                          View My Bookings →
                        </button>
                      )}
                      {n.listingInfo && !n.booking && (
                        <button onClick={e=>{e.stopPropagation();setPage("home");}} style={{marginTop:10,padding:"6px 14px",borderRadius:9,border:"1.5px solid var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>
                          🏠 View New Listing →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =============================================
   AI CHAT — Smart intent-based travel assistant
============================================= */
async function callClaude(prompt, systemMsg = "") {
  await new Promise(r => setTimeout(r, 700));

  const q = prompt.toLowerCase().trim();
  const has = (...words) => words.some(w => q.includes(w));

  // ── Greetings ──
  if (has("hello","hi ","hey","hii","helo","sup","namaste","good morning","good evening","good afternoon"))
    return "Hey there! 👋 I'm your StayBnb travel assistant. Tell me where you want to go, what you're looking for, or ask me anything about stays in India! 🇮🇳";

  if (has("thank","thanks","thx","ty "))
    return "You're welcome! 😊 Happy to help. Anything else you'd like to know about your trip?";

  if (has("bye","goodbye","see you","cya"))
    return "Goodbye! ✈️ Safe travels and enjoy your stay. Come back anytime you need travel tips! 🏠";

  // ── Amenities ──
  if (has("pool","swimming pool","infinity pool","swim"))
    return "🏊 Looking for pool stays? Our top picks:\n• **Beachfront Infinity Pool Villa** in Goa – private infinity pool with Arabian Sea views ⭐4.96\n• **Coorg Coffee Estate Bungalow** – pool surrounded by coffee estates\n• **Andaman Overwater Bungalow** – pool deck over turquoise water\nAll from Rs.8,500/night!";

  if (has("wifi","internet","connection","work from"))
    return "📶 All our stays include WiFi! Best for remote work:\n• Mumbai sea-view apartments – fiber broadband\n• Bangalore-area Coorg estates – reliable 4G\n• Goa beach villas – high-speed cable\nAll have dedicated workspaces too!";

  if (has("breakfast","meal","food included","kitchen"))
    return "🍳 Breakfast-included stays are very popular! Jaipur havelis serve royal Rajasthani breakfast, Kerala houseboats include fresh seafood meals, and Darjeeling bungalows offer first-flush tea with snacks. Many also have full kitchens!";

  if (has("parking","car","vehicle","drive"))
    return "🚗 Most of our properties include free parking! Hill station cabins in Manali & Shimla have ample space. Goa villas have private garages. In Mumbai, some apartments have paid parking nearby.";

  if (has("ac","air condition","cool","hot"))
    return "❄️ All our city and beach stays are fully air-conditioned. Mountain cabins in Manali & Shimla use heating instead — perfect for the cold! Coorg and Kerala stays often don't need AC due to the natural cool climate.";

  if (has("pet","dog","cat","animal"))
    return "🐾 Several our properties welcome pets! Coorg estate bungalows, some Manali cabins, and a few Goa villas are pet-friendly. Always mention your pet when booking so the host can confirm.";

  // ── Property types ──
  if (has("villa","villas","private villa"))
    return "🏡 Our top villas:\n• **Beachfront Infinity Pool Villa** – Goa, Rs.8,500/night ⭐4.96\n• **Andaman Overwater Bungalow** – Rs.9,200/night ⭐4.94\n• **Coorg Coffee Estate** – Rs.5,200/night ⭐4.88\nAll villas include private spaces, no shared areas!";

  if (has("houseboat","boat","backwater","alleppey","kerala water"))
    return "⛵ Kerala houseboats are a once-in-a-lifetime experience! Our **Luxury Kerala Backwater Houseboat** in Alleppey is rated ⭐5.0 — the highest rating on StayBnb! Includes personal chef, sunset cruise, and fishing. From Rs.12,000/night.";

  if (has("cabin","treehouse","tree house","forest","jungle"))
    return "🌲 Nature escapes we love:\n• **Himalayan Pine Forest Cabin** – Old Manali, Rs.3,800/night ⭐4.92\n• **Munnar Tea Estate Treehouse** – Kerala, Rs.5,800/night ⭐4.90\n• **Shimla Colonial Cottage** – Rs.4,200/night ⭐4.85\nAll tucked in nature with stunning views!";

  if (has("haveli","heritage","royal","palace","fort stay"))
    return "🏰 Heritage stays are our specialty!\n• **Royal Haveli Suite** – Jaipur Old City, Rs.6,200/night ⭐4.88\n• **Jodhpur Blue City Haveli** – Fort views, Rs.5,100/night ⭐4.86\n• **Udaipur Lake Pichola Haveli** – Lake views, Rs.4,800/night ⭐4.93\nAll are 200-500 year old restored properties!";

  if (has("tent","glamping","desert","camping","camp"))
    return "🏕️ Glamping in India is magical! Our **Golden Dunes Desert Glamping** in Jaisalmer includes camel safari, bonfire, stargazing and folk music — all under a billion stars! Rs.4,500/night. Also check Rann of Kutch white desert stays!";

  if (has("apartment","flat","studio","city stay"))
    return "🏢 Urban stays we recommend:\n• **Mumbai Bandra Sea-View Apartment** – Rs.7,800/night ⭐4.91\n• **Varanasi Assi Ghat Apartment** – Rs.2,800/night ⭐4.79\n• **Agra Taj-View Bungalow** – Rs.5,500/night ⭐4.87\nAll include high-speed WiFi and modern amenities!";

  // ── Destinations ──
  if (has("goa","calangute","baga","anjuna","panjim","north goa","south goa"))
    return "🏖️ Goa is our most popular destination! Our **Beachfront Infinity Pool Villa** is 50 steps from Calangute beach — rated ⭐4.96. Best time: Nov–Feb. Don't miss: beach shacks, Dudhsagar Falls, Old Goa churches, and the famous Saturday Night Market!";

  if (has("jaipur","pink city","rajasthan","rajput","hawa mahal","amber fort"))
    return "🏰 Jaipur is breathtaking! Our **Royal Haveli Suite** puts you in the heart of the Old City with fort views. ⭐4.88. Best time: Oct–Mar. Must-do: sunrise at Amber Fort, Hawa Mahal, City Palace, and shopping at Johari Bazaar!";

  if (has("manali","himachal","himalaya","rohtang","solang","snow","mountain"))
    return "❄️ Manali is incredible year-round! Our **Himalayan Pine Forest Cabin** in Old Manali has Himalayan views and a fireplace — ⭐4.92. Best: May–Jun (trekking) & Dec–Jan (snow). Visit Solang Valley, Rohtang Pass, Hadimba Temple!";

  if (has("kerala","kochi","munnar","wayanad","cochin","backwater"))
    return "🌿 Kerala is God's Own Country! Our **Luxury Backwater Houseboat** in Alleppey is rated ⭐5.0 — perfect! Plus Munnar tea estate treehouse for cooler weather. Best: Sep–Mar. Must-do: Kathakali dance, spice tours, Periyar wildlife!";

  if (has("agra","taj mahal","taj","mughal","fatehpur"))
    return "🕌 Agra — home of the wonder of the world! Our **Taj-View Heritage Bungalow** lets you see the Taj Mahal from your window at sunrise. ⭐4.87. Also visit: Agra Fort, Mehtab Bagh, Fatehpur Sikri. Book early — very popular!";

  if (has("varanasi","banaras","ganga","ghats","kashi","spiritual","holy"))
    return "🪔 Varanasi is India's soul! Our **Assi Ghat Apartment** has a private balcony for watching Ganga Aarti every evening. ⭐4.79. From Rs.2,800/night. Must-experience: Dawn boat ride, Dashashwamedh Ghat Aarti, Kashi Vishwanath Temple!";

  if (has("shimla","himachal","hill station","colonial","snow","ridge","mall road"))
    return "🌨️ Shimla is charming! Our **British-Era Pine Cottage** has valley views and a stone fireplace. ⭐4.85. Best: Apr–Jun & Dec for snow. Must-visit: The Ridge, Jakhu Temple, Kufri for skiing. Just 5 hours from Delhi!";

  if (has("mumbai","bombay","bandra","marine drive","gateway"))
    return "🌆 Mumbai never sleeps! Our **28th Floor Sea-View Apartment** in Bandra has jaw-dropping Arabian Sea views. ⭐4.91. From Rs.7,800/night. Must-experience: Gateway of India, Dhobi Ghat, street food at Juhu, Bandstand promenade!";

  if (has("udaipur","city of lakes","pichola","rajputana","lake"))
    return "🏯 Udaipur is pure romance! Our **Lake Pichola Haveli Room** has direct lake views with folk music at sunset. ⭐4.93. Best: Oct–Mar. Must-visit: City Palace, Jagdish Temple, Lake Palace, Saheliyon Ki Bari!";

  if (has("darjeeling","tea garden","kanchenjunga","toy train","west bengal"))
    return "☕ Darjeeling is magical! Our **Planter's Bungalow** is surrounded by tea rows with Kanchenjunga views. ⭐4.88. Best: Apr–Jun & Sep–Nov. Don't miss: Tiger Hill sunrise, Batasia Loop toy train, tea factory tour!";

  if (has("rishikesh","yoga","meditation","rafting","ganges","ashram","beatles"))
    return "🧘 Rishikesh is transformative! Our **Riverside Yoga Retreat** includes morning yoga classes and Ganga Aarti. ⭐4.82. From Rs.3,200/night. Must-do: white water rafting, Beatles Ashram, Laxman Jhula at sunset!";

  if (has("coorg","kodagu","coffee","karnataka","waterfall","abbey"))
    return "☕ Coorg — Scotland of India! Our **Colonial Coffee Estate Bungalow** is surrounded by 40 acres of working coffee, pepper, and cardamom. ⭐4.88. Visit Abbey Falls, Raja's Seat, Dubare Elephant Camp. Best: Oct–May!";

  if (has("jaisalmer","desert","thar","rajasthan desert","camel"))
    return "🏕️ Jaisalmer and the Thar Desert! Our **Golden Dunes Desert Glamping** at Sam Sand Dunes includes camel safari at sunrise, bonfire, folk music and stargazing. ⭐4.91. Rs.4,500/night. Jaisalmer Fort is 5000 years old!";

  if (has("andaman","island","beach","sea","ocean","snorkel"))
    return "🏝️ Andaman Islands are paradise! Our **Radhanagar Overwater Bungalow** sits above Asia's finest beach with coral reefs below — snorkeling gear included. ⭐4.94. Rs.9,200/night. Best: Nov–May. Fly from Chennai/Kolkata!";

  // ── Trip planning ──
  if (has("honeymoon","couple","romantic","anniversary","wedding trip"))
    return "💕 Top romantic stays for couples:\n1. **Lake Pichola Haveli** – Udaipur (most romantic city!)\n2. **Kerala Backwater Houseboat** – private sunset cruises\n3. **Goa Infinity Pool Villa** – private beach access\n4. **Andaman Overwater Bungalow** – pure seclusion\nAll have special couple amenities! Which appeals to you?";

  if (has("family","kids","children","child","toddler"))
    return "👨‍👩‍👧 Best family destinations:\n• **Goa** – beaches, water sports, safe swimming\n• **Manali** – snow activities, cable car rides\n• **Kerala** – houseboat adventure, elephant sightings\n• **Agra** – Taj Mahal experience for kids\nAll our family listings have child-safe amenities!";

  if (has("solo","alone","solo travel","single","backpack"))
    return "🎒 Solo travel in India is amazing! Top picks:\n• **Rishikesh** – meet fellow travellers, yoga classes\n• **Goa** – vibrant social scene, safe hostels upgrade\n• **Manali** – trekking groups, adventure activities\n• **Varanasi** – deep cultural immersion\nTip: Book stays with shared common areas to meet people!";

  if (has("friends","group","gang","crew","bachelorette","bachelor"))
    return "🥳 Group trips are the best! Our top group picks:\n• **Beachfront Villa Goa** – 8 guests, private pool\n• **Himalayan Cabin Manali** – 6 guests, bonfire area\n• **Coorg Coffee Estate** – 6 guests, nature activities\n• **Desert Glamping Jaisalmer** – unique group experience\nAll have group discounts available!";

  if (has("weekend","2 days","short trip","quick trip","2 night","3 night"))
    return "⚡ Best weekend getaways from major cities:\n• **From Delhi**: Agra (3hrs), Rishikesh (5hrs), Shimla (5hrs)\n• **From Mumbai**: Coorg (1hr flight), Goa (1hr flight)\n• **From Bangalore**: Coorg (4hrs), Ooty (4hrs)\n• **From Chennai**: Pondicherry (3hrs), Coorg (5hrs)\nWhich city are you travelling from?";

  if (has("week","7 days","one week","10 days","long trip"))
    return "📅 7-10 day itinerary ideas:\n• **Golden Triangle**: Delhi→Agra→Jaipur (classic!)\n• **Kerala Circuit**: Kochi→Munnar→Alleppey→Kovalam\n• **Himachal Loop**: Delhi→Shimla→Manali→Dharamshala\n• **Rajasthan Royal**: Jaipur→Jodhpur→Jaisalmer→Udaipur\nWhich sounds most exciting to you?";

  // ── Pricing ──
  if (has("cheap","affordable","budget","inexpensive","low cost","economy","rs.","rupee","price","cost","how much","rate"))
    return "💰 StayBnb price ranges:\n• **Budget** (Rs.1,500–3,000): Varanasi, Rishikesh, Old Manali\n• **Mid-range** (Rs.3,000–6,000): Shimla, Coorg, Jaipur havelis\n• **Premium** (Rs.6,000–10,000): Goa villas, Kerala houseboats\n• **Luxury** (Rs.10,000+): Andaman, Udaipur lake suites\nAll prices include taxes. Which range suits your budget?";

  if (has("discount","offer","deal","coupon","promo","save"))
    return "🏷️ Current deals on StayBnb:\n• Book 7+ nights: 15% off most properties\n• Weekday stays (Mon–Thu): 10% lower rates\n• Early bird: Book 30+ days ahead for best prices\n• Superhost properties often have loyalty discounts\nCheck individual listings for current offers!";

  // ── Booking help ──
  if (has("book","reserve","reservation","how to book","booking","check in","check out","available"))
    return "📅 Booking is easy on StayBnb!\n1. Browse listings on the Home page\n2. Click any property you like\n3. Select your check-in & check-out dates\n4. Choose number of guests\n5. Click **Reserve** → confirm booking\nYour booking appears instantly in 'My Trips'! Need help with a specific property?";

  if (has("cancel","refund","cancellation","change booking"))
    return "🔄 Cancellation policy:\n• Free cancellation up to 48 hours before check-in on most listings\n• Full refund within 24 hours of booking\n• Some premium properties have stricter policies\nCheck the specific listing's policy on the detail page before booking!";

  if (has("superhost","verified","trusted","safe","reliable"))
    return "⭐ All StayBnb Superhosts are verified! Requirements:\n• 4.8+ average rating\n• 90%+ response rate\n• 10+ completed stays\n• Zero cancellations\nLook for the **⭐ Superhost** badge on listings — these are our most trusted hosts!";

  // ── Weather/timing ──
  if (has("when to visit","best time","season","monsoon","winter","summer","weather","climate"))
    return "🌤️ Best time to visit India by region:\n• **Goa, Kerala, Andaman**: Nov–Feb (dry & pleasant)\n• **Rajasthan (Jaipur, Udaipur, Jaisalmer)**: Oct–Mar\n• **Manali, Shimla**: May–Jun (flowers) or Dec–Jan (snow)\n• **Darjeeling, Coorg**: Apr–Jun & Sep–Nov\n• **Rishikesh, Varanasi**: Sep–Nov & Feb–Apr\nAvoiding monsoon (Jul–Sep) for outdoor activities!";

  // ── Transport ──
  if (has("flight","fly","airport","air travel"))
    return "✈️ Flying to your destination:\n• Book at MakeMyTrip, Goibibo, or Skyscanner for best fares\n• Indigo & Air India cover most Indian cities\n• Goa, Jaipur, Manali (Bhuntar), Shimla, Varanasi all have airports\n• Your host will share exact directions after booking!";

  if (has("train","irctc","railway","rail","station"))
    return "🚂 Indian Railways is the best way to travel! Book at irctc.co.in\n• Rajdhani/Shatabdi Express for fast travel\n• Sleeper class for budget travel\n• Book 60–120 days in advance for popular routes\n• Your host will help with last-mile connectivity!";

  if (has("taxi","cab","uber","ola","transport","transfer","pickup"))
    return "🚕 Local transport tips:\n• **Uber/Ola** work in all major cities\n• **Auto-rickshaws** for short distances (always meter!)\n• Many hosts offer complimentary airport pickup — ask while booking!\n• Renting a scooter in Goa is very popular and affordable";

  // ── Food ──
  if (has("food","eat","restaurant","cuisine","local food","street food","veg","vegetarian"))
    return "🍛 India's food is incredible! Regional specialties:\n• **Goa**: Fish curry, prawn balchão, bebinca dessert\n• **Rajasthan**: Dal baati churma, laal maas, ghewar\n• **Kerala**: Appam & fish moilee, prawn curry, payasam\n• **Varanasi**: Kachori sabzi, thandai, banarasi paan\n• **Darjeeling**: Momos, thukpa, first-flush Darjeeling tea\nYour host will suggest the best local spots!";

  // ── Default varied responses ──
  const ctx = systemMsg?.toLowerCase() || "";
  if (ctx.includes("newsletter"))
    return "Welcome to StayBnb! 🎉 You'll discover India's most incredible handpicked stays — from Himalayan cabins to Goa beach villas — delivered to your inbox every week!";

  const fallbacks = [
    `I'd love to help with "${prompt.slice(0,30)}..."! 🤔 Could you tell me more? For example: which destination, your budget, travel dates, or what kind of experience you're looking for?`,
    "That's a great question! 🗺️ I can help with destinations, pricing, booking, packing tips, or finding the perfect property. What specifically would you like to know?",
    "Let me help you plan the perfect India trip! 🇮🇳 Are you looking for beaches (Goa/Andaman), mountains (Manali/Shimla), heritage (Jaipur/Udaipur), spiritual (Varanasi/Rishikesh), or nature (Kerala/Coorg)?",
    "I'm here to help! 🏠 Ask me about any of our 12 destinations, property types (villa, houseboat, cabin, haveli), pricing, or travel tips for India!",
  ];
  return fallbacks[Math.abs(prompt.length) % fallbacks.length];
}
/* =============================================
   NEWSLETTER BANNER  (AI-powered, fully working)
============================================= */
function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [aiMsg, setAiMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const subscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed) { setErrMsg("Please enter your email address."); return; }
    if (!isValidEmail(trimmed)) { setErrMsg("That doesn't look like a valid email. Please check and try again."); return; }
    setErrMsg("");
    setState("loading");
    try {
      const msg = await callClaude(
        `A user just subscribed to StayBnb's travel newsletter with email: ${trimmed}. 
         Write a warm, exciting 2-sentence welcome message for them. 
         Mention something about discovering India's most incredible stays. 
         Keep it under 40 words. Be enthusiastic but genuine.`,
        "You are StayBnb's friendly newsletter bot. Write short, warm, exciting welcome messages for new subscribers."
      );
      setAiMsg(msg || "Welcome aboard! 🎉 You'll now get the best handpicked stays and exclusive deals delivered straight to your inbox.");
      setState("success");
      setEmail("");
    } catch {
      setAiMsg("Welcome aboard! 🎉 You're now part of 50,000+ travellers who get India's best stays in their inbox every week.");
      setState("success");
      setEmail("");
    }
  };

  return (
    <div style={{background:"linear-gradient(135deg,#FF385C,#ff6b35)",padding:"40px",position:"relative",overflow:"hidden"}}>
      {/* Decorative circles */}
      <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
      <div style={{position:"absolute",bottom:-60,left:100,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:28,flexWrap:"wrap",position:"relative",zIndex:1}}>
        <div>
          <div style={{color:"rgba(255,255,255,.85)",fontSize:12,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>✉️ Stay in the loop</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#fff",fontWeight:700,marginBottom:6,lineHeight:1.2}}>Get exclusive deals & travel inspiration</h3>
          <p style={{color:"rgba(255,255,255,.8)",fontSize:14}}>Join 50,000+ travellers who get our weekly picks</p>
        </div>

        <div style={{flexShrink:0,minWidth:300}}>
          {state === "success" ? (
            <div className="fu" style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(10px)",borderRadius:16,padding:"20px 22px",border:"1.5px solid rgba(255,255,255,.3)"}}>
              <div style={{fontSize:28,marginBottom:8}}>🎉</div>
              <div style={{color:"#fff",fontWeight:700,fontSize:15,marginBottom:6}}>You're subscribed!</div>
              <p style={{color:"rgba(255,255,255,.9)",fontSize:13,lineHeight:1.6}}>{aiMsg}</p>
              <button onClick={()=>{setState("idle");setAiMsg("");}} style={{marginTop:12,background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.4)",color:"#fff",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>
                Subscribe another →
              </button>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",gap:10,marginBottom:errMsg?8:0}}>
                <input
                  value={email}
                  onChange={e=>{setEmail(e.target.value);setErrMsg("");}}
                  onKeyDown={e=>e.key==="Enter"&&subscribe()}
                  placeholder="Enter your email address"
                  type="email"
                  style={{flex:1,padding:"14px 18px",borderRadius:12,border:errMsg?"2px solid #fff":"2px solid transparent",fontSize:14,fontWeight:500,fontFamily:"'Sora',sans-serif",outline:"none",minWidth:0,transition:"border .2s"}}
                />
                <button
                  onClick={subscribe}
                  disabled={state==="loading"}
                  style={{padding:"14px 22px",borderRadius:12,background:state==="loading"?"rgba(0,0,0,.4)":"var(--dark)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:state==="loading"?"not-allowed":"pointer",fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap",transition:"all .2s",display:"flex",alignItems:"center",gap:8,minWidth:130,justifyContent:"center"}}
                  onMouseEnter={e=>{if(state!=="loading")e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}
                >
                  {state==="loading" ? (
                    <>
                      <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
                      Joining…
                    </>
                  ) : "Subscribe →"}
                </button>
              </div>
              {errMsg && (
                <div style={{color:"#fff",fontSize:12,fontWeight:600,background:"rgba(0,0,0,.2)",borderRadius:8,padding:"6px 12px",backdropFilter:"blur(4px)"}}>
                  ⚠️ {errMsg}
                </div>
              )}
              <p style={{color:"rgba(255,255,255,.65)",fontSize:11,marginTop:10}}>
                🔒 No spam, ever. Unsubscribe anytime. By subscribing you agree to our Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* =============================================
   AI TRAVEL CHAT WIDGET  (floating, Claude-powered)
============================================= */
function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role:"assistant", text:"Hi! 👋 I'm your StayBnb AI travel assistant. Ask me anything — best places in India, budget stays, what to pack, local tips, or help choosing a destination!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,open]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs(m=>[...m,{role:"user",text:q}]);
    setLoading(true);
    try {
      const history = msgs.map(m=>`${m.role==="user"?"User":"Assistant"}: ${m.text}`).join("\n");
      const reply = await callClaude(
        `${history}\nUser: ${q}`,
        `You are a knowledgeable, friendly travel assistant for StayBnb — India's best stay platform. 
         Help users find the perfect stay, discover Indian destinations, suggest activities, give packing tips, and recommend local experiences.
         Our platform has stays in: Goa, Jaipur, Manali, Kerala, Agra, Varanasi, Shimla, Mumbai, Udaipur, Darjeeling, Rishikesh, Coorg.
         Be warm, concise (2-4 sentences), and occasionally use travel emojis. Never say you're Claude — you're StayBnb's travel assistant.`
      );
      setMsgs(m=>[...m,{role:"assistant",text:reply}]);
    } catch(err) {
      console.error("AI error:", err);
      setMsgs(m=>[...m,{role:"assistant",text:`⚠️ AI error: ${err.message}. Please check the console for details.`}]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{position:"fixed",bottom:28,right:28,width:58,height:58,borderRadius:"50%",background:"linear-gradient(135deg,#FF385C,#ff6b35)",border:"none",cursor:"pointer",boxShadow:"0 6px 28px rgba(255,56,92,.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,zIndex:500,transition:"transform .2s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        title="Chat with AI Travel Assistant"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fu" style={{position:"fixed",bottom:98,right:28,width:360,height:500,background:"#fff",borderRadius:24,boxShadow:"0 20px 60px rgba(0,0,0,.2)",display:"flex",flexDirection:"column",zIndex:499,border:"1px solid var(--lg)",overflow:"hidden"}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#FF385C,#ff6b35)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🤖</div>
            <div>
              <div style={{color:"#fff",fontWeight:700,fontSize:14}}>StayBnb AI Assistant</div>
              <div style={{color:"rgba(255,255,255,.8)",fontSize:11,display:"flex",alignItems:"center",gap:5}}>
                <span className="dot" style={{background:"#4ade80"}}/> Online · Powered by Claude AI
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{marginLeft:"auto",background:"rgba(255,255,255,.15)",border:"none",color:"#fff",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                {m.role==="assistant"&&(
                  <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#FF385C,#ff6b35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginRight:8,marginTop:2}}>🤖</div>
                )}
                <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?"linear-gradient(135deg,#FF385C,#ff6b35)":"var(--bg)",color:m.role==="user"?"#fff":"var(--dark)",fontSize:13,lineHeight:1.6,fontWeight:m.role==="user"?600:400}}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#FF385C,#ff6b35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🤖</div>
                <div style={{background:"var(--bg)",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"var(--gray)",animation:"bounce .9s infinite",animationDelay:`${i*0.15}s`}}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick suggestions */}
          {msgs.length===1&&(
            <div style={{padding:"0 12px 8px",display:"flex",gap:6,flexWrap:"wrap"}}>
              {["Best beach stays?","Budget trips in India","What to pack for Manali?","Honeymoon destinations"].map(s=>(
                <button key={s} onClick={()=>{setInput(s);setTimeout(()=>document.getElementById("chat-input")?.focus(),50);}} style={{background:"var(--bg)",border:"1px solid var(--lg)",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",color:"var(--gray)",fontFamily:"'Sora',sans-serif",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--lg)";e.currentTarget.style.color="var(--gray)";}}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{padding:"10px 14px",borderTop:"1px solid var(--lg)",display:"flex",gap:8,alignItems:"center"}}>
            <input
              id="chat-input"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
              placeholder="Ask me anything about travel in India…"
              style={{flex:1,border:"1.5px solid var(--lg)",borderRadius:20,padding:"9px 14px",fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",transition:"border .2s"}}
              onFocus={e=>e.target.style.borderColor="var(--red)"}
              onBlur={e=>e.target.style.borderColor="var(--lg)"}
            />
            <button
              onClick={send}
              disabled={loading||!input.trim()}
              style={{width:36,height:36,borderRadius:"50%",background:input.trim()&&!loading?"linear-gradient(135deg,#FF385C,#ff6b35)":"var(--lg)",border:"none",cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,transition:"all .2s",flexShrink:0}}
            >
              {loading?"⏳":"➤"}
            </button>
          </div>
          <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}`}</style>
        </div>
      )}
    </>
  );
}

/* =============================================
   MOBILE BOTTOM NAV
============================================= */
function MobileNav({ page, setPage, user }) {
  const customerItems = [
    { page:"home", icon:"🏠", label:"Home" },
    { page:"explore", icon:"🗺️", label:"Map" },
    { page:"wishlist", icon:"❤️", label:"Saved" },
    { page:"bookings", icon:"📅", label:"Trips" },
    { page:"profile", icon:"👤", label:"Profile" },
  ];
  const hostItems = [
    { page:"home", icon:"🏠", label:"Home" },
    { page:"explore", icon:"🗺️", label:"Map" },
    { page:"newlisting", icon:"➕", label:"Add" },
    { page:"bookings", icon:"📅", label:"Bookings" },
    { page:"dashboard", icon:"📊", label:"Dashboard" },
  ];
  const items = user?.role==="host" ? hostItems : customerItems;
  return (
    <nav className="mob-nav">
      {items.map(item=>(
        <button key={item.page} className={`mob-nav-btn${page===item.page?" active":""}`} onClick={()=>setPage(item.page)}>
          <span style={{fontSize:20}}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function Explore({ setPage, setL }) {
  const [exploreListings, setExploreListings] = useState(()=>LISTINGS_STORE.getAll());
  useEffect(()=>LISTINGS_STORE.subscribe(data=>setExploreListings([...data])),[]);
  const leaflet = useLeaflet();
  const [sel, setSel] = useState(null);
  const inst = useRef(null);
  const mid = "explore-main-map";
  useEffect(()=>{
    if(!leaflet||inst.current) return;
    const L=window.L;
    const map=L.map(mid,{scrollWheelZoom:true}).setView([22,80],5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap",maxZoom:19}).addTo(map);
    LISTINGS_STORE.getAll().forEach(l=>{
      const ic=L.divIcon({className:"",iconAnchor:[28,20],html:`<div style="background:#FF385C;color:#fff;border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 4px 14px rgba(255,56,92,.4);border:2px solid #fff;cursor:pointer">Rs.${(l.price/1000).toFixed(0)}K</div>`});
      L.marker([l.lat,l.lng],{icon:ic}).addTo(map).on("click",()=>setSel(l));
    });
    inst.current=map;
    return()=>{inst.current?.remove();inst.current=null;};
  },[leaflet]);
  return (
    <div style={{height:"calc(100vh - 72px)",display:"flex"}}>
      <div style={{width:430,overflowY:"auto",borderRight:"1px solid var(--lg)",background:"#fff"}}>
        <div style={{padding:"20px 20px 12px",borderBottom:"1px solid var(--lg)"}}><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:4}}>Explore India</h2><p style={{color:"var(--gray)",fontSize:13,display:"flex",alignItems:"center",gap:6}}><span className="dot"/>{LISTINGS_STORE.getAll().length} stays · Click price pins on map</p></div>
        {(sel?[sel,...exploreListings.filter(x=>x._id!==sel._id)]:exploreListings).map(l=>(
          <div key={l._id} onClick={()=>{setL(l);setPage("detail");}} style={{display:"flex",gap:14,padding:"12px 18px",cursor:"pointer",borderTop:"1px solid var(--lg)",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <img src={l.images[0]} alt={l.title} onError={e=>e.target.src="https://picsum.photos/seed/fallback200/200/150"} style={{width:88,height:78,objectFit:"cover",borderRadius:10,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:14,lineHeight:1.3,marginBottom:3}}>{l.title}</div><div style={{color:"var(--gray)",fontSize:12,display:"flex",alignItems:"center",gap:3,marginBottom:5}}><I.Pin/>{l.location}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:800}}>Rs.{l.price.toLocaleString()}<span style={{fontWeight:400,color:"var(--gray)",fontSize:12}}>/night</span></span><span style={{display:"flex",alignItems:"center",gap:3,fontSize:12}}><I.Star/>{l.rating}</span></div></div>
          </div>
        ))}
      </div>
      <div style={{flex:1,position:"relative"}}>{leaflet?<div id={mid} style={{width:"100%",height:"100%"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--gray)",fontSize:15}}>Loading OpenStreetMap…</div>}</div>
    </div>
  );
}

/* =============================================
/* =============================================
   EMAIL CONFIG — EmailJS SDK via jsdelivr (CSP allowed)
============================================= */
const EMAILJS_SERVICE_ID  = "service_b4xp2nk";
const EMAILJS_TEMPLATE_ID = "template_sjl13yl";
const EMAILJS_PUBLIC_KEY  = "6EDRz7E2gaBC_fRvQ";

(function loadEmailJS() {
  if (window.emailjs) { try { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch(_){} return; }
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  s.onload = () => { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); console.log("✅ EmailJS ready"); };
  document.head.appendChild(s);
})();

async function sendOtpEmail(toEmail, toName, otpCode) {
  // Wait for EmailJS to load from jsdelivr
  await new Promise((resolve, reject) => {
    let tries = 40;
    const wait = () => {
      if (window.emailjs && typeof window.emailjs.send === "function") { resolve(); return; }
      if (--tries <= 0) { reject(new Error("EmailJS SDK not ready")); return; }
      setTimeout(wait, 500);
    };
    wait();
  });
  try { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch(_) {}
  const result = await window.emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    { to_email: toEmail, to_name: toName, otp_code: otpCode, from_name: "StayBnb" },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
  if (result.status !== 200) throw new Error(result.text);
  return true;
}

/* =============================================
   AUTH PANEL IMAGE STORE — host editable
============================================= */
const AUTH_PANEL_DEFAULTS = {
  bgImgs: [
    "https://hblimg.mmtcdn.com/content/hubble/img/bali/mmt/destination/m_bali_l_393_629.jpg",
    "https://www.swantour.com/blogs/wp-content/uploads/2019/03/Travel-to-Kerala.jpg",
    "https://cxnet.in/wp-content/uploads/2025/01/Airbnb-1-730x470.jpg",
  ],
  bottomCards: [
    { img:"https://res.cloudinary.com/odysseytraveller/image/fetch/f_auto,q_auto,dpr_auto,r_4,w_765,h_612,c_limit/https://cdn.odysseytraveller.com/app/uploads/2020/02/Amber-Fort.jpg", label:"Jaipur" },
    { img:"https://hblimg.mmtcdn.com/content/hubble/img/kerala_landscape/mmt/activities/m_Kerala_Dec2022_8_l_402_715.jpg", label:"Kerala" },
    { img:"https://www.travelandleisure.com/thmb/qmHq7O29-0s5MvBc8loMMHhNHmw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/banff-national-park-alberta-MOSTBEAUTIFUL0921-26a3ea1b54ca49a5a0ea5b759f8f96cd.jpg", label:"Natuer" },
    { img:"https://images.travelandleisureasia.com/wp-content/uploads/sites/2/2024/01/05095021/Cherrapunji.jpg", label:"beauty" },
    { img:"https://publish.purewow.net/wp-content/uploads/sites/2/2024/02/most-beautiful-places-in-the-world_Seljalandsfoss-Iceland.jpg?fit=680%2C400", label:"vibes" },
  ],
};

const AUTH_PANEL_STORE = (() => {
  const load = () => {
    try {
      const saved = localStorage.getItem("staybnb_auth_panel");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { bgImgs:[...AUTH_PANEL_DEFAULTS.bgImgs], bottomCards:[...AUTH_PANEL_DEFAULTS.bottomCards] };
  };
  const save = (data) => {
    try { localStorage.setItem("staybnb_auth_panel", JSON.stringify(data)); } catch(e) {}
  };
  const _state = load();
  return {
    get bgImgs() { return _state.bgImgs; },
    set bgImgs(v) { _state.bgImgs = v; save(_state); },
    get bottomCards() { return _state.bottomCards; },
    set bottomCards(v) { _state.bottomCards = v; save(_state); },
    reset() {
      _state.bgImgs = [...AUTH_PANEL_DEFAULTS.bgImgs];
      _state.bottomCards = [...AUTH_PANEL_DEFAULTS.bottomCards];
      try { localStorage.removeItem("staybnb_auth_panel"); } catch(e) {}
    },
  };
})();

/* =============================================
   LOGIN BG EDITOR MODAL (host only)
============================================= */
// eslint-disable-next-line no-unused-vars
function LoginBgEditor({ slides, cards, onSave, onClose }) {
  const [editSlides, setEditSlides] = useState([...slides]);
  const [editCards, setEditCards] = useState(cards.map(c=>({...c})));
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(null);

  const fi = {width:"100%",padding:"9px 12px",border:"1.5px solid #d1d5db",borderRadius:10,fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",background:"#fafafa",boxSizing:"border-box",transition:"border-color .2s"};
  const lbl = (t) => <div style={{fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:".06em",marginBottom:5,marginTop:14,textTransform:"uppercase"}}>{t}</div>;

  const updateSlide = (idx, val) => setEditSlides(s => s.map((x,i)=>i===idx?val:x));
  const updateCard = (idx, key, val) => setEditCards(c => c.map((x,i)=>i===idx?{...x,[key]:val}:x));

  const handleSave = () => {
    onSave(editSlides.filter(Boolean), editCards.filter(c=>c.img));
    setSaved(true);
    setTimeout(()=>setSaved(false), 800);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:540,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 100px rgba(0,0,0,.3)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"20px 26px 16px",borderBottom:"1px solid #f3f4f6",background:"linear-gradient(135deg,#fff0f2,#fff8f5)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"#FF385C",letterSpacing:".08em",textTransform:"uppercase",marginBottom:3}}>✏️ Host · Login Page Editor</div>
            <div style={{fontWeight:800,fontSize:17,fontFamily:"'Playfair Display',serif"}}>Edit Login Page Images</div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:3}}>Changes appear instantly on the login screen</div>
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:"50%",border:"1.5px solid #e5e7eb",background:"#f8f8f8",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>✕</button>
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",padding:"8px 26px 24px",flex:1}}>

          {/* Slideshow images */}
          {lbl("🖼️ Background Slideshow (3 rotating images)")}
          {editSlides.map((img, idx) => (
            <div key={idx} style={{marginTop:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:5}}>Slide {idx+1} {idx===0?"(first shown)":""}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {/* Preview thumbnail */}
                <div
                  style={{width:64,height:46,borderRadius:10,overflow:"hidden",background:"#f3f4f6",flexShrink:0,border:"1.5px solid #e5e7eb",cursor:"pointer",position:"relative"}}
                  onClick={()=>setPreviewing(previewing===idx?null:idx)}
                  title="Click to preview"
                >
                  <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.opacity=".2";}}/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.25)",opacity:0,transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                    <span style={{color:"#fff",fontSize:14}}>👁️</span>
                  </div>
                </div>
                <input
                  value={img}
                  onChange={e=>updateSlide(idx,e.target.value)}
                  style={{...fi,flex:1}}
                  placeholder="https://picsum.photos/seed/..."
                  onFocus={e=>e.target.style.borderColor="#FF385C"}
                  onBlur={e=>e.target.style.borderColor="#d1d5db"}
                />
              </div>
              {/* Expanded preview */}
              {previewing===idx && img && (
                <div style={{marginTop:8,borderRadius:14,overflow:"hidden",height:140,border:"1px solid #e5e7eb"}}>
                  <img src={img} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.background="#f3f4f6"}/>
                </div>
              )}
            </div>
          ))}

          {/* Divider */}
          <div style={{margin:"22px 0 0",borderTop:"1px solid #f3f4f6"}}/>

          {/* Destination cards */}
          {lbl("📍 Bottom Destination Cards (2 cards)")}
          <div style={{fontSize:12,color:"#9ca3af",marginBottom:8}}>These appear as small cards at the bottom of the login panel</div>
          {editCards.map((card, idx) => (
            <div key={idx} style={{display:"flex",gap:10,alignItems:"flex-end",marginTop:12,padding:"14px",background:"#f9fafb",borderRadius:14,border:"1px solid #e5e7eb"}}>
              <div style={{width:72,height:56,borderRadius:10,overflow:"hidden",background:"#e5e7eb",flexShrink:0,border:"1px solid #d1d5db"}}>
                <img src={card.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.opacity=".2"}/>
              </div>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",marginBottom:3}}>IMAGE URL</div>
                  <input value={card.img} onChange={e=>updateCard(idx,"img",e.target.value)} style={fi} placeholder="https://..." onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",marginBottom:3}}>LABEL</div>
                  <input value={card.label} onChange={e=>updateCard(idx,"label",e.target.value)} style={fi} placeholder="e.g. Jaipur" onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{padding:"16px 26px",borderTop:"1px solid #f3f4f6",background:"#fafafa",flexShrink:0}}>
          <button
            onClick={handleSave}
            style={{width:"100%",padding:"14px",borderRadius:13,border:"none",background:saved?"#10b981":"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .25s",boxShadow:"0 4px 18px rgba(255,56,92,.3)"}}
          >
            {saved?"✅ Saved! Changes live now":"💾 Save & Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================
   AUTH  — Airbnb-style full-screen login
============================================= */
// eslint-disable-next-line no-unused-vars
const COUNTRIES = [
  "India (+91)","United States (+1)","United Kingdom (+44)","Australia (+61)",
  "Canada (+1)","Germany (+49)","France (+33)","Japan (+81)","Singapore (+65)",
  "UAE (+971)","New Zealand (+64)","South Africa (+27)","Brazil (+55)",
];

function Auth({ setPage }) {
  const { login } = useAuth();
  const [tab, setTab] = useState("customer"); // "customer" | "host"
  const [subStep, setSubStep] = useState("login"); // "login" | "signup"

  // Host login state
  const [hostEmail, setHostEmail] = useState("");
  const [hostPass, setHostPass]   = useState("");
  const [hostErr, setHostErr]     = useState("");
  const [hostLoading, setHostLoading] = useState(false);

  // Customer login state
  const [custEmail, setCustEmail]   = useState("");
  const [custPass, setCustPass]     = useState("");
  const [custName, setCustName]     = useState("");
  const [custErr, setCustErr]       = useState("");
  const [custLoading, setCustLoading] = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);
  const [custConfPass, setCustConfPass] = useState("");

  // Email verification flow
  const [verifyStep, setVerifyStep] = useState(false); // show OTP screen
  const [otpCode, setOtpCode]       = useState("");    // code user types
  const [generatedOtp, setGeneratedOtp] = useState(""); // code we generated
  const [otpErr, setOtpErr]         = useState("");
  const [pendingUser, setPendingUser] = useState(null); // user waiting for verify
  // eslint-disable-next-line no-unused-vars
  const [emailSent, setEmailSent]   = useState(false);
  const [resendCool, setResendCool] = useState(0);    // countdown

  // Disposable/fake email domain blocklist
  const BLOCKED_DOMAINS = ["mailinator.com","guerrillamail.com","10minutemail.com","throwam.com","tempmail.com","yopmail.com","sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info","spam4.me","trashmail.com","maildrop.cc","dispostable.com","fakeinbox.com","mailnull.com","spamgourmet.com","trashmail.net","discard.email","spamgourmet.net","getnada.com","mohmal.com","tempr.email","dispostable.com","drdrb.com","mailexpire.com","spamex.com","spamfree24.org","spam.la","uggsrock.com","throwam.com","tempinbox.com","mt2014.com","mt2015.com","mt2016.com","fakemailgenerator.com","mailboxy.fun","instantemailaddress.com","crazymailing.com"];

  const isRealEmail = (email) => {
    if (!email) return false;
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    if (BLOCKED_DOMAINS.includes(domain)) return false;
    // Must have valid TLD (.com .in .org .net .edu etc)
    const tld = domain?.split(".").pop();
    if (!tld || tld.length < 2 || tld.length > 6) return false;
    return true;
  };

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const startResendCooldown = () => {
    setResendCool(60);
    const t = setInterval(() => {
      setResendCool(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  // Background slideshow — reads from AUTH_PANEL_STORE (edited via navbar menu)
  const bgImgs = AUTH_PANEL_STORE.bgImgs;
  const bottomCards = AUTH_PANEL_STORE.bottomCards;
  const [bgIdx, setBgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i+1)%AUTH_PANEL_STORE.bgImgs.length), 4000);
    return () => clearInterval(t);
  }, []);

  /* ── HOST LOGIN ── */
  const handleHostLogin = async () => {
    if (!hostEmail || !hostPass) { setHostErr("Please enter email and password."); return; }
    setHostLoading(true); setHostErr("");
    await new Promise(r => setTimeout(r, 900));
    if (hostEmail.trim().toLowerCase() === AUTHOR.email && hostPass === AUTHOR.password) {
      login({ ...AUTHOR, role:"host" });
    } else {
      setHostErr("❌ Access denied. Incorrect host email or password. Only the authorised host can log in here.");
    }
    setHostLoading(false);
  };

  /* ── CUSTOMER LOGIN ── */
  const handleCustLogin = async () => {
    if (!custEmail || !custPass) { setCustErr("Please enter your email and password."); return; }
    const emailLC = custEmail.trim().toLowerCase();
    if (!isRealEmail(emailLC)) { setCustErr("❌ Please enter a valid email address."); return; }
    setCustLoading(true); setCustErr("");
    await new Promise(r => setTimeout(r, 900));
    const customer = CUSTOMERS_DB.get(emailLC);
    if (customer && customer.password === custPass) {
      // ── Notify host: customer signed in ──
      NOTIFS_STORE.push({
        for: "host",
        icon: "🔑",
        title: "Customer Signed In",
        msg: `${customer.name} (${customer.email}) just logged into StayBnb.`,
        customerInfo: { name: customer.name, email: customer.email, avatar: customer.avatar },
      });
      login({ ...customer, role:"customer" });
    } else if (customer) {
      setCustErr("❌ Wrong password. Please try again.");
    } else {
      setCustErr("❌ No account found with this email. Please sign up first.");
    }
    setCustLoading(false);
  };

  /* ── CUSTOMER SIGNUP ── */
  const handleCustSignup = async () => {
    if (!custName || !custEmail || !custPass) { setCustErr("Please fill in all fields."); return; }
    if (custPass.length < 6) { setCustErr("❌ Password must be at least 6 characters."); return; }
    if (custPass !== custConfPass) { setCustErr("❌ Passwords do not match."); return; }
    const emailLC = custEmail.trim().toLowerCase();
    if (!isRealEmail(emailLC)) { setCustErr("❌ Please enter a valid, real email address. Disposable or fake emails are not allowed."); return; }
    if (emailLC === AUTHOR.email) { setCustErr("❌ This email is reserved. Use a different email."); return; }
    if (CUSTOMERS_DB.has(emailLC)) { setCustErr("❌ Account already exists. Please sign in instead."); return; }
    // Store pending user and send OTP
    setCustLoading(true); setCustErr("");
    await new Promise(r => setTimeout(r, 700));
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setPendingUser({ name:custName.trim(), email:emailLC, password:custPass, role:"customer",
      avatar:`https://ui-avatars.com/api/?name=${encodeURIComponent(custName.trim())}&background=FF385C&color=fff&bold=true`,
      joinedAt: new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"}) });
    setEmailSent(false);
    setVerifyStep(true);
    setOtpCode("");
    setOtpErr("");
    startResendCooldown();
    // Send real OTP email via EmailJS
    try {
      await sendOtpEmail(emailLC, custName.trim(), otp);
      setEmailSent(true);
    } catch(err) {
      console.error("Email error:", err);
      setEmailSent(false);
      setOtpErr(`⚠️ ${err?.message || String(err)}`);
    }
    setCustLoading(false);
  };

  /* ── VERIFY OTP ── */
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { setOtpErr("❌ Please enter the 6-digit code."); return; }
    if (otpCode !== generatedOtp) { setOtpErr("❌ Incorrect code. Please check and try again."); return; }
    setCustLoading(true);
    await new Promise(r => setTimeout(r, 700));
    CUSTOMERS_DB.set(pendingUser.email, pendingUser);

    // ── Notify host: new customer registered ──
    NOTIFS_STORE.push({
      for: "host",
      icon: "👤",
      title: "New Customer Registered!",
      msg: `${pendingUser.name} (${pendingUser.email}) just created an account on StayBnb.`,
      customerInfo: { name: pendingUser.name, email: pendingUser.email, avatar: pendingUser.avatar },
    });

    login({ ...pendingUser });
    setCustLoading(false);
    setVerifyStep(false);
  };

  const handleResendOtp = async () => {
    if (resendCool > 0) return;
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setOtpErr("");
    setOtpCode("");
    setEmailSent(false);
    startResendCooldown();
    try {
      await sendOtpEmail(pendingUser?.email, pendingUser?.name, otp);
      setEmailSent(true);
    } catch(err) {
      console.warn("EmailJS resend failed:", err);
      setEmailSent(false);
    }
  };

  const fi = { width:"100%", padding:"14px 16px", border:"1.5px solid #d1d5db", borderRadius:10,
    fontSize:15, fontWeight:400, fontFamily:"'Sora',sans-serif", outline:"none", transition:"border-color .2s",
    background:"#fafafa" };

  return (
    <div style={{minHeight:"100vh",height:"100vh",display:"flex",background:"#f3f4f6",overflow:"hidden"}}>

      {/* ── LEFT PANEL — branded image ── */}
      <div style={{flex:1,position:"relative",overflow:"hidden",display:"none"}} className="auth-left">
        <style>{`@media(min-width:900px){.auth-left{display:block!important;}}`}</style>

        {/* Slideshow backgrounds */}
        {bgImgs.map((img,i)=>(
          <div key={i} style={{position:"absolute",inset:0,backgroundImage:`url(${img})`,backgroundSize:"cover",backgroundPosition:"center",opacity:bgIdx===i?1:0,transition:"opacity 1.2s ease",zIndex:1}}/>
        ))}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,56,92,.75) 0%,rgba(0,0,0,.4) 100%)",zIndex:2}}/>



        {/* Slide dots indicator */}
        <div style={{position:"absolute",bottom:220,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6,zIndex:4}}>
          {bgImgs.map((_,i)=>(
            <button key={i} onClick={()=>setBgIdx(i)} style={{width:i===bgIdx?22:7,height:7,borderRadius:7,border:"none",background:i===bgIdx?"#fff":"rgba(255,255,255,.45)",padding:0,cursor:"pointer",transition:"all .3s"}}/>
          ))}
        </div>

        <div style={{position:"absolute",inset:0,zIndex:3,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 52px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:"1.5px solid rgba(255,255,255,.3)"}}>🏠</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:30,color:"#fff",fontWeight:800,letterSpacing:-.5}}>StayBnb</span>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,.7)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>India's finest stays</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:44,color:"#fff",fontWeight:700,lineHeight:1.12,marginBottom:18,letterSpacing:-.5}}>Find your perfect<br/>stay anywhere</h2>
            <p style={{color:"rgba(255,255,255,.8)",fontSize:16,lineHeight:1.7,maxWidth:380}}>From Himalayan cabins to Goa beach villas — handpicked stays with real hosts across India's most stunning destinations.</p>
            <div style={{display:"flex",gap:14,marginTop:32,flexWrap:"wrap"}}>
              {[["🏠","16+ Stays"],["⭐","4.9 Rating"],["🗺️","12 Cities"],["👥","50K+ Guests"]].map(([ic,lb])=>(
                <div key={lb} style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.25)",borderRadius:40,padding:"8px 18px",display:"flex",alignItems:"center",gap:8,color:"#fff",fontSize:13,fontWeight:700}}>
                  <span>{ic}</span>{lb}
                </div>
              ))}
            </div>
          </div>
          {/* Bottom destination cards — editable */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {bottomCards.map((c,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,.12)",backdropFilter:"blur(12px)",borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,.2)",width:120}}>
                <img src={c.img} style={{width:"100%",height:76,objectFit:"cover"}} alt={c.label} onError={e=>e.target.style.background="#ffffff30"}/>
                <div style={{padding:"8px 12px",color:"#fff",fontSize:12,fontWeight:700}}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div style={{width:"100%",maxWidth:520,background:"#fff",display:"flex",flexDirection:"column",height:"100vh",overflowY:"auto",boxShadow:"-8px 0 40px rgba(0,0,0,.08)"}}>

        {/* Header bar */}
        <div style={{borderBottom:"1px solid #f3f4f6",padding:"18px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,background:"linear-gradient(135deg,#FF385C,#ff6b35)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏠</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"var(--red)",fontWeight:800}}>StayBnb</span>
          </div>
          <span style={{fontWeight:700,fontSize:14,color:"#374151"}}>Welcome back</span>
        </div>

        <div style={{flex:1,padding:"32px 36px 40px"}}>

          {/* ── ROLE TABS ── */}
          <div style={{display:"flex",background:"#f3f4f6",borderRadius:14,padding:4,marginBottom:32,gap:4}}>
            {[["customer","👤 I'm a Guest"],["host","🏠 I'm a Host"]].map(([r,lbl])=>(
              <button key={r} onClick={()=>{setTab(r);setCustErr("");setHostErr("");}} style={{flex:1,padding:"11px 0",borderRadius:11,border:"none",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .2s",background:tab===r?"#fff":"transparent",color:tab===r?"var(--red)":"#6b7280",boxShadow:tab===r?"0 2px 8px rgba(0,0,0,.1)":"none"}}>
                {lbl}
              </button>
            ))}
          </div>

          {/* ══════════ CUSTOMER PANEL ══════════ */}
          {tab === "customer" && (
            <div className="fu">

              {/* ── OTP VERIFICATION SCREEN ── */}
              {verifyStep ? (
                <div>
                  <div style={{textAlign:"center",marginBottom:24}}>
                    <div style={{width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#FF385C15,#ff6b3520)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px",border:"1.5px solid #FF385C30"}}>📧</div>
                    <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:6}}>Verify Your Email</h2>
                    <p style={{color:"#6b7280",fontSize:13,lineHeight:1.6}}>
                      We sent a 6-digit verification code to<br/>
                      <b style={{color:"#374151"}}>{pendingUser?.email}</b>
                    </p>
                    <p style={{color:"#9ca3af",fontSize:12,marginTop:6}}>Check your inbox (and spam folder)</p>
                  </div>


                  {otpErr && (
                    <div style={{background:"#fff0f2",border:"1px solid #fecdd3",color:"#be123c",borderRadius:10,padding:"12px 16px",fontSize:13,fontWeight:600,marginBottom:16}}>
                      {otpErr}
                    </div>
                  )}

                  {/* OTP input — 6 boxes */}
                  <div>
                    <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:10,letterSpacing:".04em"}}>ENTER 6-DIGIT CODE</label>
                    <input
                      value={otpCode}
                      onChange={e=>{ const v=e.target.value.replace(/\D/g,"").slice(0,6); setOtpCode(v); setOtpErr(""); }}
                      onKeyDown={e=>e.key==="Enter"&&handleVerifyOtp()}
                      maxLength={6}
                      placeholder="• • • • • •"
                      style={{...fi, textAlign:"center", fontSize:28, fontWeight:800, letterSpacing:"12px", padding:"16px", borderRadius:14, border:`2px solid ${otpCode.length===6?"#10b981":"#d1d5db"}`, background:"#fafafa", width:"100%", boxSizing:"border-box", transition:"border-color .2s"}}
                      onFocus={e=>e.target.style.borderColor="#FF385C"}
                      onBlur={e=>e.target.style.borderColor=otpCode.length===6?"#10b981":"#d1d5db"}
                      autoFocus
                    />
                  </div>

                  <button onClick={handleVerifyOtp} disabled={custLoading||otpCode.length!==6}
                    style={{width:"100%",padding:"15px",borderRadius:12,background:otpCode.length===6?"linear-gradient(135deg,#10b981,#059669)":"#e5e7eb",color:otpCode.length===6?"#fff":"#9ca3af",border:"none",fontSize:16,fontWeight:700,cursor:otpCode.length===6?"pointer":"not-allowed",fontFamily:"'Sora',sans-serif",marginTop:16,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
                    {custLoading&&<div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>}
                    {custLoading?"Verifying…":"✅ Verify & Create Account"}
                  </button>

                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <button onClick={()=>{setVerifyStep(false);setCustErr("");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#6b7280",fontFamily:"'Sora',sans-serif",textDecoration:"underline"}}>
                      ← Back
                    </button>
                    <button onClick={handleResendOtp} disabled={resendCool>0}
                      style={{background:"none",border:"none",cursor:resendCool>0?"not-allowed":"pointer",fontSize:13,color:resendCool>0?"#9ca3af":"var(--red)",fontFamily:"'Sora',sans-serif",fontWeight:600,textDecoration:resendCool>0?"none":"underline"}}>
                      {resendCool>0?`Resend in ${resendCool}s`:"Resend Code"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Login / Signup sub-tabs — hide signup if already registered */}
                  {!CUSTOMERS_DB.has(custEmail.trim().toLowerCase()) || custEmail.trim()==="" ? (
                    <div style={{display:"flex",gap:24,marginBottom:28,borderBottom:"2px solid #f3f4f6"}}>
                      {[["login","Sign In"],["signup","Create Account"]].map(([s,lbl])=>(
                        <button key={s} onClick={()=>{setSubStep(s);setCustErr("");}} style={{paddingBottom:14,border:"none",background:"none",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'Sora',sans-serif",color:subStep===s?"var(--red)":"#9ca3af",borderBottom:subStep===s?"2px solid var(--red)":"2px solid transparent",marginBottom:-2,transition:"all .2s"}}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{display:"flex",gap:24,marginBottom:28,borderBottom:"2px solid #f3f4f6"}}>
                      <button onClick={()=>{setSubStep("login");setCustErr("");}} style={{paddingBottom:14,border:"none",background:"none",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'Sora',sans-serif",color:"var(--red)",borderBottom:"2px solid var(--red)",marginBottom:-2}}>
                        Sign In
                      </button>
                    </div>
                  )}

                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,marginBottom:6}}>
                    {subStep==="login"?"Welcome back! 👋":"Join StayBnb 🎉"}
                  </h2>
                  <p style={{color:"#6b7280",fontSize:14,marginBottom:24}}>
                    {subStep==="login"?"Sign in to explore amazing stays across India":"Create your account and start exploring"}
                  </p>

                  {custErr && (
                    <div style={{background:"#fff0f2",border:"1px solid #fecdd3",color:"#be123c",borderRadius:10,padding:"12px 16px",fontSize:13,fontWeight:600,marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
                      <span>⚠️</span>{custErr}
                    </div>
                  )}

                  <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
                    {subStep==="signup" && (
                      <div>
                        <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:".04em"}}>FULL NAME</label>
                        <input style={fi} placeholder="Enter your full name" value={custName} onChange={e=>setCustName(e.target.value)} onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
                      </div>
                    )}
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:".04em"}}>EMAIL ADDRESS</label>
                      <input style={fi} type="email" placeholder="your@gmail.com / your@outlook.com" value={custEmail}
                        onChange={e=>{setCustEmail(e.target.value);setCustErr("");}}
                        onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>{e.target.style.borderColor="#d1d5db"; if(custEmail&&!isRealEmail(custEmail.trim().toLowerCase())) setCustErr("❌ Please use a real email address (e.g. Gmail, Outlook, Yahoo).");}}/>
                      {subStep==="signup"&&<div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Use your real email — a verification code will be sent</div>}
                    </div>
                    <div>
                      <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:".04em"}}>PASSWORD</label>
                      <div style={{position:"relative"}}>
                        <input style={{...fi,paddingRight:48}} type={showPass?"text":"password"} placeholder={subStep==="signup"?"Min. 6 characters":"Your password"} value={custPass} onChange={e=>setCustPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(subStep==="login"?handleCustLogin():null)} onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
                        <button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9ca3af"}}>
                          {showPass?"🙈":"👁️"}
                        </button>
                      </div>
                    </div>
                    {subStep==="signup" && (
                      <div>
                        <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:".04em"}}>CONFIRM PASSWORD</label>
                        <div style={{position:"relative"}}>
                          <input style={{...fi,paddingRight:48,borderColor:custConfPass&&custConfPass!==custPass?"#ef4444":custConfPass&&custConfPass===custPass?"#10b981":"#d1d5db"}} type={showConfPass?"text":"password"} placeholder="Re-enter your password" value={custConfPass} onChange={e=>setCustConfPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCustSignup()} onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>e.target.style.borderColor=custConfPass&&custConfPass!==custPass?"#ef4444":custConfPass&&custConfPass===custPass?"#10b981":"#d1d5db"}/>
                          <button onClick={()=>setShowConfPass(v=>!v)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9ca3af"}}>
                            {showConfPass?"🙈":"👁️"}
                          </button>
                          {custConfPass && <span style={{position:"absolute",right:44,top:"50%",transform:"translateY(-50%)",fontSize:14}}>{custConfPass===custPass?"✅":"❌"}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={subStep==="login"?handleCustLogin:handleCustSignup} disabled={custLoading}
                    style={{width:"100%",padding:"15px",borderRadius:12,background:"linear-gradient(135deg,#FF385C,#e0314f)",color:"#fff",border:"none",fontSize:16,fontWeight:700,cursor:custLoading?"not-allowed":"pointer",fontFamily:"'Sora',sans-serif",marginBottom:16,opacity:custLoading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform .2s"}}
                    onMouseEnter={e=>{if(!custLoading)e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                    {custLoading&&<div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>}
                    {custLoading?"Please wait…":subStep==="login"?"Sign In →":"Continue →"}
                  </button>

                  {subStep==="login" && !CUSTOMERS_DB.has(custEmail.trim().toLowerCase()) && (
                    <p style={{textAlign:"center",marginTop:14,fontSize:13,color:"#6b7280"}}>
                      New here?{" "}
                      <button onClick={()=>{setSubStep("signup");setCustErr("");setCustConfPass("");}} style={{color:"var(--red)",fontWeight:700,background:"none",border:"none",cursor:"pointer",fontSize:13,fontFamily:"'Sora',sans-serif",textDecoration:"underline"}}>
                        Create a free account
                      </button>
                    </p>
                  )}
                  {subStep==="signup" && (
                    <p style={{textAlign:"center",marginTop:8,fontSize:12,color:"#9ca3af",lineHeight:1.5}}>
                      By creating an account you agree to our Terms. A verification code will be sent to confirm your email.
                    </p>
                  )}
                </>
              )}

            </div>
          )}

          {/* ══════════ HOST / AUTHOR PANEL ══════════ */}
          {tab === "host" && (
            <div className="fu">
              {/* Special host badge */}
              <div style={{background:"linear-gradient(135deg,#FF385C15,#ff6b3510)",border:"1.5px solid #FF385C40",borderRadius:16,padding:"16px 20px",marginBottom:28,display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,background:"linear-gradient(135deg,#FF385C,#ff6b35)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🏠</div>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:"var(--red)",marginBottom:2}}>Host / Admin Portal</div>
                  <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>Exclusive access for property owners. Manage listings, view bookings & customer data.</div>
                </div>
              </div>

              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,marginBottom:6}}>Host Sign In 🔐</h2>
              <p style={{color:"#6b7280",fontSize:14,marginBottom:24}}>Use your designated host credentials to access the management portal.</p>

              {hostErr && (
                <div style={{background:"#fff0f2",border:"1px solid #fecdd3",color:"#be123c",borderRadius:10,padding:"12px 16px",fontSize:13,fontWeight:600,marginBottom:18}}>
                  {hostErr}
                </div>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:".04em"}}>HOST EMAIL</label>
                  <input style={fi} type="email" placeholder="staynb.sandeep@gmail.com" value={hostEmail} onChange={e=>setHostEmail(e.target.value)} onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#374151",marginBottom:6,letterSpacing:".04em"}}>HOST PASSWORD</label>
                  <div style={{position:"relative"}}>
                    <input style={{...fi,paddingRight:48}} type={showPass?"text":"password"} placeholder="••••••••••" value={hostPass} onChange={e=>setHostPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleHostLogin()} onFocus={e=>e.target.style.borderColor="#FF385C"} onBlur={e=>e.target.style.borderColor="#d1d5db"}/>
                    <button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9ca3af"}}>
                      {showPass?"🙈":"👁️"}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleHostLogin} disabled={hostLoading}
                style={{width:"100%",padding:"15px",borderRadius:12,background:hostLoading?"#9ca3af":"linear-gradient(135deg,#FF385C,#e0314f)",color:"#fff",border:"none",fontSize:16,fontWeight:700,cursor:hostLoading?"not-allowed":"pointer",fontFamily:"'Sora',sans-serif",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform .2s"}}
                onMouseEnter={e=>{if(!hostLoading)e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                {hostLoading&&<div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>}
                {hostLoading?"Authenticating…":"Access Host Portal →"}
              </button>


            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{borderTop:"1px solid #f3f4f6",padding:"14px 36px",display:"flex",gap:16,flexWrap:"wrap"}}>
          {["Privacy","Terms","Help"].map(l=><button key={l} onClick={()=>{}} style={{fontSize:12,color:"#9ca3af",textDecoration:"none",fontWeight:500,background:"none",border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif"}} onMouseEnter={e=>e.target.style.color="#374151"} onMouseLeave={e=>e.target.style.color="#9ca3af"}>{l}</button>)}
          <span style={{marginLeft:"auto",fontSize:12,color:"#d1d5db"}}>© 2025 StayBnb</span>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}


/* =============================================
   NEW LISTING
============================================= */
function NewListing({ setPage }) {
  const { user } = useAuth();
  const [step,setStep] = useState(1);
  const [form,setForm] = useState({title:"",location:"",price:"",type:"Apartment",desc:"",bedrooms:1,bathrooms:1,maxGuests:2,amenities:[]});
  const [loading,setLoading] = useState(false);
  const [done,setDone] = useState(false);
  const amen = ["WiFi","Pool","AC","Kitchen","Parking","Breakfast","Fireplace","Balcony","Gym","Garden","Workspace","Rooftop"];
  if(!user) return <div style={{textAlign:"center",padding:"80px"}}><div style={{fontSize:52,marginBottom:16}}>🔒</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,marginBottom:16}}>Sign in to list your space</h2><button className="btn r" onClick={()=>setPage("login")}>Sign In</button></div>;
  if(done) return <div style={{maxWidth:500,margin:"80px auto",textAlign:"center",padding:"40px 32px"}} className="fu"><div style={{fontSize:64,marginBottom:20}}>🎉</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:32,marginBottom:10}}>You're live!</h2><p style={{color:"var(--gray)",marginBottom:28}}><b>{form.title}</b> is now on StayBnb</p><button className="btn r" style={{width:"100%"}} onClick={()=>setPage("home")}>View All Listings</button></div>;
  const submit = async()=>{
    if(!form.title||!form.location||!form.price){alert("Fill required fields");return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,1200));

    // ── Notify ALL registered customers about new listing ──
    const allCustomers = CUSTOMERS_DB.getAll();
    allCustomers.forEach(customer => {
      NOTIFS_STORE.push({
        for: customer.email,
        icon: "🏠",
        title: "New Property Listed!",
        msg: `A new ${form.type} "${form.title}" has just been listed in ${form.location} at Rs.${Number(form.price).toLocaleString()}/night. Be the first to book!`,
        listingInfo: { title: form.title, location: form.location, type: form.type, price: form.price },
      });
    });

    setDone(true);
    setLoading(false);
  };
  const fi = {width:"100%",padding:"13px 16px",border:"1.5px solid var(--lg)",borderRadius:12,fontSize:14,fontWeight:500};
  const steps = ["Property Type","Basic Info","Details","Amenities"];
  const te = {Apartment:"🏢",Villa:"🏡",Cabin:"🌲",Heritage:"🏰",Houseboat:"⛵",Glamping:"🏕️"};
  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"40px 32px"}}>
      <div style={{display:"flex",gap:8,marginBottom:36}}>{steps.map((s,i)=><div key={s} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><div style={{width:"100%",height:4,borderRadius:4,background:i+1<=step?"var(--red)":"var(--lg)",transition:"background .3s"}}/><span style={{fontSize:10,fontWeight:700,color:i+1===step?"var(--red)":"var(--gray)",textAlign:"center"}}>{s}</span></div>)}</div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,marginBottom:28}}>{steps[step-1]}</h1>
      {step===1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{Object.keys(te).map(t=><button key={t} onClick={()=>setForm(v=>({...v,type:t}))} style={{padding:"22px 18px",border:`2px solid ${form.type===t?"var(--dark)":"var(--lg)"}`,background:form.type===t?"var(--bg)":"#fff",borderRadius:16,cursor:"pointer",fontWeight:700,fontSize:15,textAlign:"left",transition:"all .15s",fontFamily:"'Sora',sans-serif"}}><div style={{fontSize:30,marginBottom:8}}>{te[t]}</div>{t}</button>)}</div>}
      {step===2&&<div style={{display:"flex",flexDirection:"column",gap:18}}><div><label style={{display:"block",fontWeight:700,marginBottom:6}}>Title *</label><input style={fi} placeholder="e.g. Cozy Beachfront Villa" value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))}/></div><div><label style={{display:"block",fontWeight:700,marginBottom:6}}>Location *</label><input style={fi} placeholder="City, State" value={form.location} onChange={e=>setForm(v=>({...v,location:e.target.value}))}/></div><div><label style={{display:"block",fontWeight:700,marginBottom:6}}>Description</label><textarea style={{...fi,minHeight:110,resize:"vertical"}} placeholder="Tell guests about your space…" value={form.desc} onChange={e=>setForm(v=>({...v,desc:e.target.value}))}/></div><div style={{border:"2px dashed var(--lg)",borderRadius:16,padding:28,textAlign:"center",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}><I.Upload/><span style={{fontWeight:700,color:"var(--gray)"}}>Upload Photos</span><span style={{fontSize:13,color:"var(--gray)"}}>Connects to Cloudinary</span></div></div>}
      {step===3&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{[["Price/Night (Rs.) *","price"],["Max Guests","maxGuests"],["Bedrooms","bedrooms"],["Bathrooms","bathrooms"]].map(([lbl,key])=><div key={key}><label style={{display:"block",fontWeight:700,marginBottom:6}}>{lbl}</label><input type="number" min={1} style={fi} value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}/></div>)}</div>}
      {step===4&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{amen.map(a=>{const on=form.amenities.includes(a);return(<button key={a} onClick={()=>setForm(v=>({...v,amenities:on?v.amenities.filter(x=>x!==a):[...v.amenities,a]}))} style={{padding:"13px 16px",border:`2px solid ${on?"var(--dark)":"var(--lg)"}`,background:on?"var(--bg)":"#fff",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontWeight:600,fontSize:13,transition:"all .15s",fontFamily:"'Sora',sans-serif"}}><span>{AICONS[a]||"✅"}</span>{a}{on&&<span style={{marginLeft:"auto",color:"var(--green)"}}>✓</span>}</button>);})}</div>}
      <div style={{display:"flex",gap:12,marginTop:36}}>
        {step>1&&<button className="btn gh" onClick={()=>setStep(s=>s-1)} style={{flex:1}}>Back</button>}
        {step<4?<button className="btn r" onClick={()=>setStep(s=>s+1)} style={{flex:2}}>Continue →</button>:<button className="btn r" onClick={submit} disabled={loading} style={{flex:2,opacity:loading?.7:1}}>{loading?"Publishing…":"Publish 🚀"}</button>}
      </div>
    </div>
  );
}

/* =============================================
   BOOKINGS
============================================= */
/* ── Booking Edit Modal (host only) ── */
function BookingEditModal({ booking, onSave, onClose }) {
  const listing = LISTINGS_STORE.getAll().find(l=>l._id===(booking.listingId||booking.listing?._id)) || booking.listing || LISTINGS_STORE.getAll()[0];
  const [form, setForm] = useState({
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    status: booking.status,
    total: booking.total,
  });
  const [saved, setSaved] = useState(false);
  const fi = {width:"100%",padding:"10px 13px",border:"1.5px solid var(--lg)",borderRadius:10,fontSize:13,fontFamily:"'Sora',sans-serif",outline:"none",background:"#fafafa",boxSizing:"border-box",transition:"border-color .2s"};
  const lbl = (t) => <div style={{fontSize:11,fontWeight:800,color:"var(--gray)",letterSpacing:".06em",marginBottom:5,marginTop:14}}>{t}</div>;
  const handleSave = () => {
    onSave({ ...booking, ...form, guests: Number(form.guests), total: Number(form.total) });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:460,boxShadow:"0 24px 80px rgba(0,0,0,.22)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid var(--lg)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,#FF385C10,#ff6b3508)"}}>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:"var(--red)",letterSpacing:".08em",marginBottom:3}}>✏️ HOST · EDIT BOOKING</div>
            <div style={{fontWeight:800,fontSize:16,fontFamily:"'Playfair Display',serif"}}>{listing.title}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--lg)",background:"#f8f8f8",cursor:"pointer",fontSize:15,fontWeight:700}}>✕</button>
        </div>
        <div style={{padding:"4px 24px 24px"}}>
          {booking.customerName && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:16,padding:"10px 14px",background:"#f0f9ff",borderRadius:12,border:"1px solid #bae6fd"}}>
              <img src={booking.customerAvatar||"https://ui-avatars.com/api/?name=Guest"} style={{width:32,height:32,borderRadius:"50%"}} alt="guest"/>
              <div><div style={{fontWeight:700,fontSize:13,color:"#0369a1"}}>{booking.customerName}</div><div style={{fontSize:11,color:"var(--gray)"}}>{booking.customerEmail}</div></div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>{lbl("CHECK-IN")} <input type="date" value={form.checkIn} onChange={e=>setForm(f=>({...f,checkIn:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/></div>
            <div>{lbl("CHECK-OUT")} <input type="date" value={form.checkOut} onChange={e=>setForm(f=>({...f,checkOut:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>{lbl("GUESTS")} <input type="number" min={1} max={listing.maxGuests||10} value={form.guests} onChange={e=>setForm(f=>({...f,guests:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/></div>
            <div>{lbl("TOTAL (Rs.)")} <input type="number" value={form.total} onChange={e=>setForm(f=>({...f,total:e.target.value}))} style={fi} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--lg)"}/></div>
          </div>
          {lbl("STATUS")}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["confirmed","pending","completed","cancelled"].map(s=>(
              <button key={s} onClick={()=>setForm(f=>({...f,status:s}))} style={{padding:"7px 16px",borderRadius:20,border:`1.5px solid ${form.status===s?"var(--red)":"var(--lg)"}`,background:form.status===s?"var(--red)":"#fff",color:form.status===s?"#fff":"var(--dark)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",textTransform:"capitalize",transition:"all .15s"}}>
                {s==="confirmed"?"✅":s==="pending"?"⏳":s==="completed"?"🏁":"❌"} {s}
              </button>
            ))}
          </div>
          <button onClick={handleSave} style={{marginTop:20,width:"100%",padding:"13px",borderRadius:12,border:"none",background:saved?"#10b981":"linear-gradient(135deg,#FF385C,#ff6b35)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .25s"}}>
            {saved?"✅ Saved!":"💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Cancel Confirm Modal ── */
function CancelModal({ booking, onConfirm, onClose, isHost }) {
  const listing = LISTINGS_STORE.getAll().find(l=>l._id===(booking.listingId||booking.listing?._id)) || booking.listing || LISTINGS_STORE.getAll()[0];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:420,padding:"32px 28px",boxShadow:"0 24px 80px rgba(0,0,0,.22)",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:52,marginBottom:14}}>⚠️</div>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>Cancel Booking?</h3>
        <p style={{color:"var(--gray)",fontSize:13,lineHeight:1.6,marginBottom:6}}><b>{listing.title}</b></p>
        <p style={{color:"var(--gray)",fontSize:13,marginBottom:24}}>
          {isHost ? "As host, you can cancel this booking. The guest will be notified." : "Are you sure you want to cancel this booking? This action cannot be undone."}
        </p>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid var(--lg)",background:"#f8f8f8",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>Keep Booking</button>
          <button onClick={onConfirm} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Sora',sans-serif",boxShadow:"0 4px 14px rgba(239,68,68,.35)"}}>Yes, Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Bookings({ setPage, setL }) {
  const { user } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const [bookings, setBookings] = useState(() => BOOKINGS_STORE.getAll());
  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  if(!user) return (
    <div style={{textAlign:"center",padding:"80px"}}>
      <div style={{fontSize:48,marginBottom:16}}>📅</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:16}}>Sign in to see bookings</h2>
      <button className="btn r" onClick={()=>setPage("login")}>Sign In</button>
    </div>
  );

  const isHost = user.role === "host";
  const allBookings = isHost
    ? bookings
    : bookings.filter(b => b.customerEmail === user.email);

  const now = new Date();
  const upcoming  = allBookings.filter(b => b.status !== "cancelled" && (new Date(b.checkIn) >= now || b.status==="confirmed" || b.status==="pending"));
  const past      = allBookings.filter(b => b.status !== "cancelled" && (new Date(b.checkOut) < now || b.status==="completed"));
  const cancelled = allBookings.filter(b => b.status === "cancelled");

  const shown = tab==="upcoming" ? upcoming : tab==="past" ? past : cancelled;

  const doCancel = () => {
    const updated = bookings.map(b => b._id===cancelTarget._id ? {...b, status:"cancelled"} : b);
    setBookings(updated);
    BOOKINGS_STORE._data = updated;
    setCancelTarget(null);
  };

  const doEdit = (updated) => {
    const newList = bookings.map(b => b._id===updated._id ? updated : b);
    setBookings(newList);
    BOOKINGS_STORE._data = newList;
    setEditTarget(null);
  };

  const statusBadge = (s) => {
    if(s==="confirmed") return <span className="badge bg" style={{fontSize:11,padding:"4px 12px"}}>✅ Confirmed</span>;
    if(s==="pending")   return <span className="badge by" style={{fontSize:11,padding:"4px 12px"}}>⏳ Pending</span>;
    if(s==="completed") return <span className="badge bg" style={{fontSize:11,padding:"4px 12px"}}>🏁 Completed</span>;
    if(s==="cancelled") return <span style={{fontSize:11,padding:"4px 12px",background:"#fee2e2",color:"#dc2626",borderRadius:20,fontWeight:700}}>❌ Cancelled</span>;
    return null;
  };

  return (
    <div style={{maxWidth:960,margin:"0 auto",padding:"40px 32px"}} className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,marginBottom:6}}>
            {isHost ? "📅 All Bookings" : "📅 My Trips"}
          </h1>
          <p style={{color:"var(--gray)",fontSize:14}}>
            {isHost ? `${allBookings.length} total bookings` : `${allBookings.length} booking${allBookings.length!==1?"s":""} in your account`}
          </p>
        </div>
        {!isHost && <button className="btn r" onClick={()=>setPage("home")} style={{gap:6,fontSize:14}}>🔍 Find More Stays</button>}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:"#f3f4f6",borderRadius:14,padding:4,marginBottom:28,width:"fit-content"}}>
        {[["upcoming","🗓️ Upcoming",upcoming.length],["past","✅ Past",past.length],["cancelled","❌ Cancelled",cancelled.length]].map(([k,lbl,cnt])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"10px 20px",borderRadius:11,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .2s",background:tab===k?"#fff":"transparent",color:tab===k?"var(--red)":"#6b7280",boxShadow:tab===k?"0 2px 8px rgba(0,0,0,.1)":"none"}}>
            {lbl} {tab===k&&`(${cnt})`}
          </button>
        ))}
      </div>

      {shown.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 0",color:"var(--gray)"}}>
          <div style={{fontSize:52,marginBottom:16}}>{tab==="upcoming"?"🏖️":tab==="past"?"📜":"❌"}</div>
          <h3 style={{fontSize:20,fontWeight:700,marginBottom:8}}>
            {tab==="upcoming"?"No upcoming trips":tab==="past"?"No past trips yet":"No cancelled bookings"}
          </h3>
          <p style={{marginBottom:20}}>{tab==="upcoming"?"Time to plan your next adventure!":tab==="past"?"Your completed trips will appear here":"Cancelled bookings will show here"}</p>
          {tab==="upcoming"&&<button className="btn r" onClick={()=>setPage("home")}>Explore Stays</button>}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {shown.map((b,i)=>{
            const listing = LISTINGS_STORE.getAll().find(l=>l._id===(b.listingId||b.listing?._id)) || b.listing || LISTINGS_STORE.getAll()[0];
            const isCancelled = b.status === "cancelled";
            return (
              <div key={b._id||i} style={{display:"flex",borderRadius:20,overflow:"hidden",border:`1.5px solid ${isCancelled?"#fecaca":"var(--lg)"}`,boxShadow:"0 2px 12px rgba(0,0,0,.06)",opacity:isCancelled?.65:1,transition:"all .2s",background:isCancelled?"#fff5f5":"#fff"}}>
                <img src={listing.images[0]} alt={listing.title} onError={e=>e.target.src="https://picsum.photos/seed/fallback300/300/200"} onClick={()=>{if(!isCancelled){setL(listing);setPage("detail");}}} style={{width:170,height:"auto",minHeight:140,objectFit:"cover",flexShrink:0,cursor:isCancelled?"default":"pointer",filter:isCancelled?"grayscale(50%)":"none"}}/>
                <div style={{padding:"18px 22px",flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}}>
                    <div>
                      <h3 style={{fontWeight:700,fontSize:16,marginBottom:3}}>{listing.title}</h3>
                      <div style={{color:"var(--gray)",fontSize:12,display:"flex",alignItems:"center",gap:4}}><I.Pin/>{listing.location}</div>
                    </div>
                    {statusBadge(b.status)}
                  </div>

                  {/* Host: customer info */}
                  {isHost && b.customerName && (
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 12px",background:"#f0f9ff",borderRadius:10}}>
                      <img src={b.customerAvatar||"https://ui-avatars.com/api/?name=Guest"} style={{width:28,height:28,borderRadius:"50%"}} alt={b.customerName}/>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#0369a1"}}>{b.customerName}</div>
                        <div style={{fontSize:11,color:"var(--gray)"}}>{b.customerEmail}</div>
                      </div>
                      <span style={{marginLeft:"auto",fontSize:11,background:"#e0f2fe",color:"#0369a1",padding:"2px 8px",borderRadius:10,fontWeight:700}}>Guest</span>
                    </div>
                  )}

                  <div style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:14}}>
                    {[["📅 Check-in",b.checkIn],["📅 Checkout",b.checkOut],["👥 Guests",`${b.guests} guest${b.guests>1?"s":""}`],["💰 Total",`Rs.${b.total?.toLocaleString()}`]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{color:"var(--gray)",fontSize:10,fontWeight:800,letterSpacing:".04em"}}>{l}</div>
                        <div style={{fontWeight:700,marginTop:2,fontSize:13,color:l.includes("💰")?"var(--red)":"inherit"}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {!isCancelled && (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {isHost && (
                        <button onClick={()=>setEditTarget(b)} style={{padding:"7px 16px",borderRadius:10,border:"1.5px solid var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--red)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff0f3";e.currentTarget.style.color="var(--red)";}}>
                          ✏️ Edit Booking
                        </button>
                      )}
                      <button onClick={()=>setCancelTarget(b)} style={{padding:"7px 16px",borderRadius:10,border:"1.5px solid #fca5a5",background:"#fff5f5",color:"#dc2626",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#dc2626";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff5f5";e.currentTarget.style.color="#dc2626";e.currentTarget.style.borderColor="#fca5a5";}}>
                        ❌ Cancel Booking
                      </button>
                      {!isHost && (
                        <button onClick={()=>{setL(listing);setPage("detail");}} style={{padding:"7px 16px",borderRadius:10,border:"1.5px solid var(--lg)",background:"#f8f8f8",color:"var(--dark)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#f8f8f8";e.currentTarget.style.color="var(--dark)";}}>
                          View Property →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cancelTarget && <CancelModal booking={cancelTarget} isHost={isHost} onConfirm={doCancel} onClose={()=>setCancelTarget(null)}/>}
      {editTarget   && <BookingEditModal booking={editTarget} onSave={doEdit} onClose={()=>setEditTarget(null)}/>}
    </div>
  );
}

/* =============================================
   DASHBOARD
============================================= */
function Dashboard({ setPage, setL }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(() => BOOKINGS_STORE.getAll());
  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);       // booking edit
  const [listingEditTarget, setListingEditTarget] = useState(null);
  const [custCancelTarget, setCustCancelTarget] = useState(null);
  const [dashListings, setDashListings] = useState(() => LISTINGS_STORE.getAll());
  const [customers, setCustomers] = useState(() => CUSTOMERS_DB.getAll());
  // eslint-disable-next-line no-unused-vars
  const [customerTick, setCustomerTick] = useState(0);
  useEffect(() => LISTINGS_STORE.subscribe(data => setDashListings([...data])), []);
  useEffect(() => CUSTOMERS_DB.subscribe(data => setCustomers([...data])), []);

  // Always refresh from localStorage on mount and on window focus
  useEffect(() => {
    const refresh = () => {
      setCustomers(CUSTOMERS_DB.getAll());
      setBookings(BOOKINGS_STORE.getAll());
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const handleListingEdit = (updated) => { LISTINGS_STORE.update(updated); setListingEditTarget(null); };

  if(!user) return <div style={{textAlign:"center",padding:"80px"}}><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:16}}>Sign in required</h2><button className="btn r" onClick={()=>setPage("login")}>Sign In</button></div>;

  const doCancel = () => {
    const target = cancelTarget || custCancelTarget;
    const updated = bookings.map(b => b._id===target._id ? {...b, status:"cancelled"} : b);
    setBookings(updated);
    BOOKINGS_STORE._data = updated;
    setCancelTarget(null);
    setCustCancelTarget(null);
  };

  const doEdit = (updated) => {
    const newList = bookings.map(b => b._id===updated._id ? updated : b);
    setBookings(newList);
    BOOKINGS_STORE._data = newList;
    setEditTarget(null);
  };

  const statusBadge = (s) => {
    if(s==="confirmed") return <span className="badge bg" style={{fontSize:11,padding:"3px 10px"}}>✅ Confirmed</span>;
    if(s==="pending")   return <span className="badge by" style={{fontSize:11,padding:"3px 10px"}}>⏳ Pending</span>;
    if(s==="completed") return <span style={{fontSize:11,padding:"3px 10px",background:"#d1fae5",color:"#065f46",borderRadius:20,fontWeight:700}}>🏁 Completed</span>;
    return <span style={{fontSize:11,padding:"3px 10px",background:"#fee2e2",color:"#dc2626",borderRadius:20,fontWeight:700}}>❌ Cancelled</span>;
  };

  // ── HOST DASHBOARD ──
  if(user.role === "host") {
    const allBookings = bookings;
    const activeBookings = allBookings.filter(b=>b.status!=="cancelled");
    const totalEarned = activeBookings.reduce((s,b)=>s+(b.total||0),0);
    const hostStats=[
      ["📅", allBookings.length, "Total Bookings","#3b82f6"],
      ["🏠", dashListings.length,"Active Listings","var(--green)"],
      ["💰", totalEarned>0?`Rs.${Math.round(totalEarned/1000)}K`:"Rs.0","Total Earned","var(--red)"],
      ["👥", customers.length,"Registered Customers","#f59e0b"],
    ];
    return (
      <div style={{maxWidth:1200,margin:"0 auto",padding:"40px 36px"}} className="fu">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:36}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#fff0f2",border:"1px solid #fecdd3",borderRadius:20,padding:"5px 14px",marginBottom:10}}>
              <span style={{fontSize:14}}>🏠</span><span style={{fontSize:12,fontWeight:800,color:"var(--red)"}}>HOST ADMIN PORTAL</span>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,marginBottom:6}}>Welcome, {user.name.split(" ")[0]}! 👋</h1>
            <p style={{color:"var(--gray)",fontSize:14,display:"flex",alignItems:"center",gap:6}}><span className="dot"/>Live dashboard · Manage your properties</p>
          </div>
          <button className="btn r" onClick={()=>setPage("newlisting")}>+ Add New Listing</button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18,marginBottom:44}}>
          {hostStats.map(([ic,v,l,c],i)=>(
            <div key={l} className={`fu s${i+1}`} style={{background:"#fff",borderRadius:20,padding:"22px 20px",border:"1.5px solid var(--lg)",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:28,marginBottom:10}}>{ic}</div>
              <div style={{fontSize:26,fontWeight:800,color:c,marginBottom:4}}>{v}</div>
              <div style={{color:"var(--gray)",fontSize:13,fontWeight:600}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Registered Customers */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24}}>👥 Registered Customers</h2>
          <button onClick={()=>setCustomers(CUSTOMERS_DB.getAll())} style={{padding:"7px 16px",borderRadius:10,border:"1.5px solid var(--lg)",background:"#f8f8f8",color:"var(--dark)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#f8f8f8";e.currentTarget.style.color="var(--dark)";}}>
            🔄 Refresh
          </button>
        </div>
        <div style={{background:"#fff",borderRadius:20,border:"1.5px solid var(--lg)",overflow:"hidden",marginBottom:44,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
          {customers.length===0 ? (
            <div style={{padding:"40px",textAlign:"center",color:"var(--gray)"}}>
              <div style={{fontSize:40,marginBottom:12}}>👤</div>
              <div style={{fontWeight:600}}>No customers registered yet</div>
              <div style={{fontSize:13,marginTop:4}}>Customers who sign up will appear here</div>
            </div>
          ) : (
            <table>
              <thead><tr>{["Customer","Email","Joined","Status","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {customers.map(c=>(
                  <tr key={c.email}>
                    <td><div style={{display:"flex",alignItems:"center",gap:10}}><img src={c.avatar} alt={c.name} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover"}}/><span style={{fontWeight:700}}>{c.name}</span></div></td>
                    <td style={{color:"var(--gray)"}}>{c.email}</td>
                    <td style={{color:"var(--gray)"}}>{c.joinedAt||"Recently"}</td>
                    <td><span className="badge bg">Active</span></td>
                    <td>
                      <button
                        onClick={()=>{
                          if(window.confirm(`Remove ${c.name} (${c.email}) from StayBnb? They will need to re-register.`)){
                            CUSTOMERS_DB.delete(c.email);
                          }
                        }}
                        style={{padding:"5px 12px",borderRadius:8,border:"1.5px solid #fca5a5",background:"#fff5f5",color:"#dc2626",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.color="#fff";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#fff5f5";e.currentTarget.style.color="#dc2626";}}
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* All Bookings — host can Edit + Cancel each */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24}}>📅 All Bookings</h2>
          <button onClick={()=>setPage("bookings")} style={{fontSize:13,fontWeight:700,color:"var(--red)",background:"none",border:"1.5px solid var(--red)",borderRadius:10,padding:"7px 16px",cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>View Full Page →</button>
        </div>
        {allBookings.length===0 ? (
          <div style={{background:"#fff",borderRadius:20,border:"1.5px solid var(--lg)",padding:"48px",textAlign:"center",color:"var(--gray)",marginBottom:44}}>
            <div style={{fontSize:44,marginBottom:12}}>📭</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>No bookings yet</div>
            <div style={{fontSize:13}}>Bookings made by customers will appear here in real time</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:44}}>
            {allBookings.map((b,i)=>{
              const listing = LISTINGS_STORE.getAll().find(l=>l._id===(b.listingId||b.listing?._id))||b.listing||LISTINGS_STORE.getAll()[0];
              const isCancelled = b.status==="cancelled";
              return (
                <div key={b._id||i} style={{display:"flex",borderRadius:18,overflow:"hidden",border:`1.5px solid ${isCancelled?"#fecaca":"var(--lg)"}`,boxShadow:"0 2px 10px rgba(0,0,0,.05)",opacity:isCancelled?.6:1,background:isCancelled?"#fff5f5":"#fff"}}>
                  <img src={listing.images[0]} alt={listing.title} style={{width:130,objectFit:"cover",flexShrink:0,filter:isCancelled?"grayscale(60%)":"none",cursor:"pointer"}} onClick={()=>{setL(listing);setPage("detail");}} onError={e=>e.target.src="https://picsum.photos/seed/fallback/300/200"}/>
                  <div style={{padding:"16px 20px",flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{listing.title}</div>
                        <div style={{color:"var(--gray)",fontSize:12,display:"flex",alignItems:"center",gap:4}}><I.Pin/>{listing.location}</div>
                      </div>
                      {statusBadge(b.status)}
                    </div>
                    {b.customerName && (
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"7px 12px",background:"#f0f9ff",borderRadius:10,border:"1px solid #bae6fd"}}>
                        <img src={b.customerAvatar||"https://ui-avatars.com/api/?name=Guest"} style={{width:26,height:26,borderRadius:"50%"}} alt={b.customerName}/>
                        <div style={{fontSize:12,fontWeight:700,color:"#0369a1"}}>{b.customerName}</div>
                        <div style={{fontSize:11,color:"var(--gray)",marginLeft:4}}>{b.customerEmail}</div>
                        <span style={{marginLeft:"auto",fontSize:10,background:"#e0f2fe",color:"#0369a1",padding:"2px 8px",borderRadius:8,fontWeight:700}}>Guest</span>
                      </div>
                    )}
                    <div style={{display:"flex",gap:18,flexWrap:"wrap",marginBottom:12}}>
                      {[["📅 Check-in",b.checkIn],["📅 Checkout",b.checkOut],["👥 Guests",`${b.guests} guest${b.guests>1?"s":""}`],["💰 Total",`Rs.${b.total?.toLocaleString()}`]].map(([lbl,val])=>(
                        <div key={lbl}>
                          <div style={{color:"var(--gray)",fontSize:10,fontWeight:800,letterSpacing:".04em"}}>{lbl}</div>
                          <div style={{fontWeight:700,marginTop:2,fontSize:13,color:lbl.includes("💰")?"var(--red)":"inherit"}}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {/* Host action buttons */}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {!isCancelled && (
                        <>
                          <button onClick={()=>setEditTarget(b)} style={{padding:"6px 14px",borderRadius:9,border:"1.5px solid var(--red)",background:"#fff0f3",color:"var(--red)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--red)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff0f3";e.currentTarget.style.color="var(--red)";}}>
                            ✏️ Edit
                          </button>
                          <button onClick={()=>setCancelTarget(b)} style={{padding:"6px 14px",borderRadius:9,border:"1.5px solid #fca5a5",background:"#fff5f5",color:"#dc2626",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#dc2626";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff5f5";e.currentTarget.style.color="#dc2626";e.currentTarget.style.borderColor="#fca5a5";}}>
                            ❌ Cancel
                          </button>
                        </>
                      )}
                      <button onClick={()=>{setL(listing);setPage("detail");}} style={{padding:"6px 14px",borderRadius:9,border:"1.5px solid var(--lg)",background:"#f8f8f8",color:"var(--dark)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#f8f8f8";e.currentTarget.style.color="var(--dark)";}}>
                        View Property →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Listings */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24}}>🏠 Your Listings</h2>
          <span style={{fontSize:12,fontWeight:700,color:"#92400e",background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:8,padding:"5px 12px"}}>✏️ Click Edit on any card to update</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:24}}>
          {dashListings.slice(0,6).map((l,i)=>(
            <Card key={l._id} l={l} delay={i} onClick={()=>{setL(l);setPage("detail");}} isHost={true} onEdit={(listing)=>setListingEditTarget(listing)}/>
          ))}
        </div>

        {cancelTarget && <CancelModal booking={cancelTarget} isHost={true} onConfirm={doCancel} onClose={()=>setCancelTarget(null)}/>}
        {editTarget   && <BookingEditModal booking={editTarget} onSave={doEdit} onClose={()=>setEditTarget(null)}/>}
        {listingEditTarget && <ListingEditModal listing={listingEditTarget} onSave={handleListingEdit} onClose={()=>setListingEditTarget(null)}/>}
      </div>
    );
  }

  // ── CUSTOMER DASHBOARD ──
  const myBookings = bookings.filter(b=>b.customerEmail===user.email);
  const activeTrips = myBookings.filter(b=>b.status!=="cancelled");

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"40px 36px"}} className="fu">
      <div style={{marginBottom:32}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#e0f2fe",border:"1px solid #bae6fd",borderRadius:20,padding:"5px 14px",marginBottom:10}}>
          <span style={{fontSize:14}}>👤</span><span style={{fontSize:12,fontWeight:800,color:"#0369a1"}}>GUEST ACCOUNT</span>
        </div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,marginBottom:6}}>Welcome, {user.name.split(" ")[0]}! 👋</h1>
        <p style={{color:"var(--gray)",fontSize:14,display:"flex",alignItems:"center",gap:6}}><span className="dot"/>Your travel dashboard</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,marginBottom:44}}>
        {[["✈️",activeTrips.length,"Active Trips","#3b82f6"],["📅",myBookings.length,"Total Bookings","var(--red)"],["❌",myBookings.filter(b=>b.status==="cancelled").length,"Cancelled","#6b7280"]].map(([ic,v,l,c],i)=>(
          <div key={l} className={`fu s${i+1}`} style={{background:"#fff",borderRadius:20,padding:"22px 20px",border:"1.5px solid var(--lg)",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:28,marginBottom:10}}>{ic}</div>
            <div style={{fontSize:26,fontWeight:800,color:c,marginBottom:4}}>{v}</div>
            <div style={{color:"var(--gray)",fontSize:13,fontWeight:600}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24}}>Your Bookings</h2>
        <button onClick={()=>setPage("bookings")} style={{fontSize:13,fontWeight:700,color:"var(--red)",background:"none",border:"1.5px solid var(--red)",borderRadius:10,padding:"7px 16px",cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>View All →</button>
      </div>

      {myBookings.length===0 ? (
        <div style={{background:"#fff",borderRadius:20,border:"1.5px solid var(--lg)",padding:"48px",textAlign:"center",color:"var(--gray)",marginBottom:44}}>
          <div style={{fontSize:44,marginBottom:12}}>🏖️</div>
          <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>No bookings yet</div>
          <div style={{fontSize:13,marginBottom:20}}>Your booked stays will appear here</div>
          <button className="btn r" onClick={()=>setPage("home")}>Explore Stays</button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:44}}>
          {myBookings.map((b,i)=>{
            const listing = LISTINGS_STORE.getAll().find(l=>l._id===(b.listingId||b.listing?._id))||b.listing||LISTINGS_STORE.getAll()[0];
            const isCancelled = b.status==="cancelled";
            return (
              <div key={b._id||i} style={{display:"flex",borderRadius:18,overflow:"hidden",border:`1.5px solid ${isCancelled?"#fecaca":"var(--lg)"}`,boxShadow:"0 2px 10px rgba(0,0,0,.05)",opacity:isCancelled?.6:1,background:isCancelled?"#fff5f5":"#fff"}}>
                <img src={listing.images[0]} alt={listing.title} style={{width:120,objectFit:"cover",flexShrink:0,filter:isCancelled?"grayscale(60%)":"none",cursor:isCancelled?"default":"pointer"}} onClick={()=>{if(!isCancelled){setL(listing);setPage("detail");}}} onError={e=>e.target.src="https://picsum.photos/seed/fallback/300/200"}/>
                <div style={{padding:"16px 20px",flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{listing.title}</div>
                      <div style={{color:"var(--gray)",fontSize:12,display:"flex",alignItems:"center",gap:4}}><I.Pin/>{listing.location}</div>
                    </div>
                    {statusBadge(b.status)}
                  </div>
                  <div style={{display:"flex",gap:18,flexWrap:"wrap",marginBottom:12}}>
                    {[["📅 Check-in",b.checkIn],["📅 Checkout",b.checkOut],["👥 Guests",`${b.guests} guest${b.guests>1?"s":""}`],["💰 Total",`Rs.${b.total?.toLocaleString()}`]].map(([lbl,val])=>(
                      <div key={lbl}>
                        <div style={{color:"var(--gray)",fontSize:10,fontWeight:800,letterSpacing:".04em"}}>{lbl}</div>
                        <div style={{fontWeight:700,marginTop:2,fontSize:13,color:lbl.includes("💰")?"var(--red)":"inherit"}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {!isCancelled && (
                      <button onClick={()=>setCustCancelTarget(b)} style={{padding:"6px 14px",borderRadius:9,border:"1.5px solid #fca5a5",background:"#fff5f5",color:"#dc2626",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#dc2626";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#dc2626";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff5f5";e.currentTarget.style.color="#dc2626";e.currentTarget.style.borderColor="#fca5a5";}}>
                        ❌ Cancel Booking
                      </button>
                    )}
                    {isCancelled && (
                      <span style={{padding:"6px 14px",borderRadius:9,background:"#fee2e2",color:"#dc2626",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:5}}>
                        ❌ Booking Cancelled
                      </span>
                    )}
                    <button onClick={()=>{setL(listing);setPage("detail");}} style={{padding:"6px 14px",borderRadius:9,border:"1.5px solid var(--lg)",background:"#f8f8f8",color:"var(--dark)",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="var(--dark)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="#f8f8f8";e.currentTarget.style.color="var(--dark)";}}>
                      View Property →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
        <button className="btn r" onClick={()=>setPage("home")} style={{gap:8}}>🔍 Explore More Stays</button>
        <button className="btn gh" onClick={()=>setPage("wishlist")} style={{gap:8}}>❤️ View Wishlist</button>
        <button className="btn gh" onClick={()=>setPage("profile")} style={{gap:8}}>👤 Edit Profile</button>
      </div>

      {custCancelTarget && <CancelModal booking={custCancelTarget} isHost={false} onConfirm={doCancel} onClose={()=>setCustCancelTarget(null)}/>}
    </div>
  );
}

/* =============================================
   ROOT
============================================= */
export default function App() {
  const [page, setPage] = useState("login");
  const [listingId, setListingId] = useState(null); // store ID only, not the object
  const [user, setUser] = useState(null);
  // Track store updates so components re-render on host edit
  // eslint-disable-next-line no-unused-vars
  const [storeVersion, setStoreVersion] = useState(0);

  // Track store updates so detail page re-renders on host edit
  useEffect(() => LISTINGS_STORE.subscribe(() => setStoreVersion(v => v+1)), []);

  // Always resolve listing fresh from store
  const listing = listingId ? LISTINGS_STORE.getAll().find(l => l._id === listingId) || null : null;

  // setL now just saves the ID
  const setL = (l) => setListingId(l?._id || null);

  const login = (u) => {
    setUser(u);
    setPage("home"); // go home after login
  };
  const logout = () => {
    setUser(null);
    setPage("login"); // go back to login after logout
  };

  const auth = { user, login, logout };

  // Pages that require login
  const PROTECTED = ["home","detail","explore","newlisting","bookings","dashboard","wishlist","profile","notifications"];

  // If not logged in and trying to access any protected page → force login screen
  const isAuthPage = page === "login" || page === "register";
  const needsAuth  = !user && PROTECTED.includes(page);

  // Full-screen auth (login / register / forced redirect)
  if (isAuthPage || needsAuth) {
    return (
      <Ctx.Provider value={auth}>
        <S/>
        <div style={{minHeight:"100vh"}}>
          <Auth mode={page === "register" ? "register" : "login"} setPage={setPage}/>
        </div>
      </Ctx.Provider>
    );
  }

  // Pages only hosts can access
  const HOST_ONLY = ["newlisting"];
  // If customer tries to access host page, redirect to home
  if (user && user.role === "customer" && HOST_ONLY.includes(page)) {
    setPage("home");
    return null;
  }

  const views = {
    home:<Home setPage={setPage} setL={setL}/>,
    detail:listing?<Detail l={listing} setPage={setPage}/>:null,
    explore:<Explore setPage={setPage} setL={setL}/>,
    newlisting:<NewListing setPage={setPage}/>,
    bookings:<Bookings setPage={setPage} setL={setL}/>,
    dashboard:<Dashboard setPage={setPage} setL={setL}/>,
    wishlist:<WishlistPage setPage={setPage} setL={setL}/>,
    profile:<ProfilePage setPage={setPage}/>,
    notifications:<NotificationsPage setPage={setPage}/>,
  };

  return (
    <Ctx.Provider value={auth}>
      <S/>
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <Navbar setPage={setPage}/>
        <main style={{flex:1}}>{views[page]||views.home}</main>
        <MobileNav page={page} setPage={setPage} user={user}/>
        <AIChatWidget/>
        <footer style={{borderTop:"1px solid var(--lg)",background:"var(--bg)"}}>
          <NewsletterBanner/>

          {/* Main footer columns */}
          <div style={{padding:"44px 40px 32px",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:32,maxWidth:1380,margin:"0 auto",boxSizing:"border-box"}}>
            {/* Brand column */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{width:38,height:38,background:"linear-gradient(135deg,#FF385C,#ff6b35)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 12px rgba(255,56,92,.3)"}}>🏠</div>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--red)",fontWeight:800}}>StayBnb</span>
              </div>
              <p style={{color:"var(--gray)",fontSize:14,lineHeight:1.7,marginBottom:20,maxWidth:280}}>Discover handpicked villas, havelis, houseboats and cabins across India's most extraordinary destinations.</p>
              <div style={{display:"flex",gap:10}}>
                {[
                  {icon:"f", color:"#1877F2", label:"Facebook"},
                  {icon:"in", color:"#E1306C", label:"Instagram"},
                  {icon:"t", color:"#1DA1F2", label:"Twitter"},
                  {icon:"yt", color:"#FF0000", label:"YouTube"},
                ].map(s=>(
                  <button key={s.label} title={s.label} style={{width:38,height:38,borderRadius:"50%",background:s.color+"15",border:`1.5px solid ${s.color}30`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:s.color,transition:"all .2s",fontFamily:"sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.background=s.color;e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background=s.color+"15";e.currentTarget.style.color=s.color;}}>
                    {s.icon==="f"?"f":s.icon==="in"?"📸":s.icon==="t"?"𝕏":"▶"}
                  </button>
                ))}
              </div>
            </div>

            {/* Discover */}
            <div>
              <div style={{fontWeight:800,fontSize:13,letterSpacing:".06em",marginBottom:16,color:"var(--dark)"}}>DISCOVER</div>
              {["Goa Beaches","Rajasthan Forts","Kerala Backwaters","Himalayan Cabins","Heritage Havelis","Desert Glamping","Mumbai Apartments","Andaman Islands"].map(l=>(
                <div key={l} style={{marginBottom:10}}><a href="/" onClick={e=>e.preventDefault()} style={{color:"var(--gray)",textDecoration:"none",fontSize:14,fontWeight:500,transition:"color .15s"}} onMouseEnter={e=>e.target.style.color="var(--dark)"} onMouseLeave={e=>e.target.style.color="var(--gray)"}>{l}</a></div>
              ))}
            </div>

            {/* Hosting */}
            <div>
              <div style={{fontWeight:800,fontSize:13,letterSpacing:".06em",marginBottom:16,color:"var(--dark)"}}>HOSTING</div>
              {["List your property","Host resources","Community forum","Responsible hosting","Host guarantee","Anti-discrimination","Cancellation options","Tax information"].map(l=>(
                <div key={l} style={{marginBottom:10}}><a href="/" onClick={e=>e.preventDefault()} style={{color:"var(--gray)",textDecoration:"none",fontSize:14,fontWeight:500,transition:"color .15s"}} onMouseEnter={e=>e.target.style.color="var(--dark)"} onMouseLeave={e=>e.target.style.color="var(--gray)"}>{l}</a></div>
              ))}
            </div>

            {/* Support */}
            <div>
              <div style={{fontWeight:800,fontSize:13,letterSpacing:".06em",marginBottom:16,color:"var(--dark)"}}>SUPPORT</div>
              {["Help Center","Safety information","Cancellation options","Disability support","Report a concern","Trust & safety","Terms of service","Privacy policy"].map(l=>(
                <div key={l} style={{marginBottom:10}}><a href="/" onClick={e=>e.preventDefault()} style={{color:"var(--gray)",textDecoration:"none",fontSize:14,fontWeight:500,transition:"color .15s"}} onMouseEnter={e=>e.target.style.color="var(--dark)"} onMouseLeave={e=>e.target.style.color="var(--gray)"}>{l}</a></div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{borderTop:"1px solid var(--lg)",padding:"18px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,maxWidth:1380,margin:"0 auto",boxSizing:"border-box"}}>
            <div style={{fontSize:13,color:"var(--gray)",display:"flex",alignItems:"center",gap:6}}>
              <span>© 2025 StayBnb, Inc.</span>
              <span>·</span><span>MERN Stack Capstone</span>
              <span>·</span><span>Module 8</span>
            </div>
            <div style={{display:"flex",gap:18,fontSize:13}}>
              {["Privacy","Terms","Sitemap","Destinations"].map(l=><a key={l} href="/" onClick={e=>e.preventDefault()} style={{color:"var(--gray)",textDecoration:"none",fontWeight:600}} onMouseEnter={e=>e.target.style.color="var(--dark)"} onMouseLeave={e=>e.target.style.color="var(--gray)"}>{l}</a>)}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"var(--dark)"}}>
              <I.Globe/> India · ₹ INR · English
            </div>
          </div>
        </footer>
      </div>
    </Ctx.Provider>
  );
}