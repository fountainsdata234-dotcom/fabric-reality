// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";

// shared/validation.ts
var COUNTRY_PHONE_RULES = {
  NG: { min: 10, max: 11, example: "0802 977 2375", dial: "234" },
  US: { min: 10, max: 10, example: "202 555 0123", dial: "1" },
  GB: { min: 10, max: 11, example: "07911 123456", dial: "44" },
  GH: { min: 9, max: 10, example: "024 123 4567", dial: "233" },
  KE: { min: 9, max: 10, example: "0712 345678", dial: "254" },
  ZA: { min: 9, max: 10, example: "071 234 5678", dial: "27" },
  CA: { min: 10, max: 10, example: "416 555 0123", dial: "1" },
  AE: { min: 9, max: 9, example: "050 123 4567", dial: "971" },
  FR: { min: 9, max: 10, example: "06 12 34 56 78", dial: "33" },
  DE: { min: 10, max: 11, example: "0151 1234567", dial: "49" },
  IT: { min: 9, max: 11, example: "312 345 6789", dial: "39" },
  ES: { min: 9, max: 9, example: "612 345 678", dial: "34" },
  AU: { min: 9, max: 10, example: "0412 345 678", dial: "61" },
  IN: { min: 10, max: 10, example: "09876 543210", dial: "91" },
  SN: { min: 9, max: 9, example: "77 123 45 67", dial: "221" },
  CI: { min: 8, max: 10, example: "07 12 34 56", dial: "225" },
  CM: { min: 8, max: 9, example: "6 71 23 45 67", dial: "237" },
  EG: { min: 10, max: 11, example: "0100 123 4567", dial: "20" },
  RW: { min: 9, max: 9, example: "078 123 4567", dial: "250" },
  UG: { min: 9, max: 10, example: "0712 345678", dial: "256" },
  TZ: { min: 9, max: 10, example: "0712 345678", dial: "255" },
  ET: { min: 9, max: 10, example: "091 123 4567", dial: "251" },
  SA: { min: 9, max: 10, example: "050 123 4567", dial: "966" },
  QA: { min: 8, max: 8, example: "3312 3456", dial: "974" },
  NL: { min: 9, max: 10, example: "06 1234 5678", dial: "31" },
  BE: { min: 9, max: 10, example: "0470 12 34 56", dial: "32" },
  SE: { min: 9, max: 10, example: "070 123 4567", dial: "46" },
  CH: { min: 9, max: 10, example: "076 123 45 67", dial: "41" },
  IE: { min: 9, max: 10, example: "085 123 4567", dial: "353" },
  BR: { min: 10, max: 11, example: "11 91234 5678", dial: "55" },
  JM: { min: 7, max: 10, example: "876 234 5678", dial: "1876" },
  TT: { min: 7, max: 10, example: "868 234 5678", dial: "1868" },
  BJ: { min: 8, max: 8, example: "90 12 34 56", dial: "229" },
  TG: { min: 8, max: 8, example: "90 12 34 56", dial: "228" },
  LR: { min: 7, max: 9, example: "077 012 3456", dial: "231" },
  SL: { min: 8, max: 8, example: "076 123456", dial: "232" },
  GM: { min: 7, max: 7, example: "301 2345", dial: "220" },
  CN: { min: 11, max: 11, example: "138 0013 8000", dial: "86" },
  JP: { min: 10, max: 11, example: "090 1234 5678", dial: "81" },
  SG: { min: 8, max: 8, example: "8123 4567", dial: "65" },
  MY: { min: 9, max: 10, example: "012 345 6789", dial: "60" },
  NZ: { min: 8, max: 10, example: "021 123 4567", dial: "64" },
  TR: { min: 10, max: 11, example: "0532 123 4567", dial: "90" },
  MX: { min: 10, max: 10, example: "55 1234 5678", dial: "52" }
};
var validatePhoneNumber = (phone, countryCode) => {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, message: "Phone number is required." };
  }
  const digitsOnly = phone.replace(/\D/g, "");
  if (/[a-zA-Z]/.test(phone)) {
    return { valid: false, message: "Phone number must not contain letters." };
  }
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { valid: false, message: "Phone number must have between 7 and 15 digits." };
  }
  if (countryCode) {
    const rules = COUNTRY_PHONE_RULES[countryCode.toUpperCase()];
    if (rules) {
      let localDigits = digitsOnly;
      if (rules.dial && digitsOnly.startsWith(rules.dial)) {
        localDigits = digitsOnly.substring(rules.dial.length);
      }
      if (localDigits.length < rules.min || localDigits.length > rules.max) {
        return {
          valid: false,
          message: `Phone number for this country should have ${rules.min === rules.max ? rules.min : `${rules.min}-${rules.max}`} digits. You entered ${localDigits.length}.`
        };
      }
    }
  }
  return { valid: true, message: "Valid phone number." };
};
var validatePassword = (password) => {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters long." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain an uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain a lowercase letter." };
  if (!/\d/.test(password)) return { valid: false, message: "Password must contain a number." };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: "Password must contain a special character." };
  return { valid: true, message: "Password is strong" };
};

// src/data/countries.ts
var COUNTRIES = [
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "\u{1F1F3}\u{1F1EC}", lat: 9.082, lng: 8.6753 },
  { name: "United States", code: "US", dialCode: "+1", flag: "\u{1F1FA}\u{1F1F8}", lat: 37.0902, lng: -95.7129 },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "\u{1F1EC}\u{1F1E7}", lat: 55.3781, lng: -3.436 },
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "\u{1F1EC}\u{1F1ED}", lat: 7.9465, lng: -1.0232 },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "\u{1F1F0}\u{1F1EA}", lat: -0.0236, lng: 37.9062 },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "\u{1F1FF}\u{1F1E6}", lat: -30.5595, lng: 22.9375 },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "\u{1F1E8}\u{1F1E6}", lat: 56.1304, lng: -106.3468 },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "\u{1F1E6}\u{1F1EA}", lat: 23.4241, lng: 53.8478 },
  { name: "France", code: "FR", dialCode: "+33", flag: "\u{1F1EB}\u{1F1F7}", lat: 46.2276, lng: 2.2137 },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "\u{1F1E9}\u{1F1EA}", lat: 51.1657, lng: 10.4515 },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "\u{1F1EE}\u{1F1F9}", lat: 41.8719, lng: 12.5674 },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "\u{1F1EA}\u{1F1F8}", lat: 40.4637, lng: -3.7492 },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "\u{1F1E6}\u{1F1FA}", lat: -25.2744, lng: 133.7751 },
  { name: "India", code: "IN", dialCode: "+91", flag: "\u{1F1EE}\u{1F1F3}", lat: 20.5937, lng: 78.9629 },
  { name: "Senegal", code: "SN", dialCode: "+221", flag: "\u{1F1F8}\u{1F1F3}", lat: 14.4974, lng: -14.4524 },
  { name: "Ivory Coast", code: "CI", dialCode: "+225", flag: "\u{1F1E8}\u{1F1EE}", lat: 7.54, lng: -5.5471 },
  { name: "Cameroon", code: "CM", dialCode: "+237", flag: "\u{1F1E8}\u{1F1F2}", lat: 7.3697, lng: 12.3547 },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "\u{1F1EA}\u{1F1EC}", lat: 26.8206, lng: 30.8025 },
  { name: "Rwanda", code: "RW", dialCode: "+250", flag: "\u{1F1F7}\u{1F1FC}", lat: -1.9403, lng: 29.8739 },
  { name: "Uganda", code: "UG", dialCode: "+256", flag: "\u{1F1FA}\u{1F1EC}", lat: 1.3733, lng: 32.2903 },
  { name: "Tanzania", code: "TZ", dialCode: "+255", flag: "\u{1F1F9}\u{1F1FF}", lat: -6.369, lng: 34.8888 },
  { name: "Ethiopia", code: "ET", dialCode: "+251", flag: "\u{1F1EA}\u{1F1F9}", lat: 9.145, lng: 40.4897 },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "\u{1F1F8}\u{1F1E6}", lat: 23.8859, lng: 45.0792 },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "\u{1F1F6}\u{1F1E6}", lat: 25.3548, lng: 51.1839 },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "\u{1F1F3}\u{1F1F1}", lat: 52.1326, lng: 5.2913 },
  { name: "Belgium", code: "BE", dialCode: "+32", flag: "\u{1F1E7}\u{1F1EA}", lat: 50.5039, lng: 4.4699 },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "\u{1F1F8}\u{1F1EA}", lat: 60.1282, lng: 18.6435 },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "\u{1F1E8}\u{1F1ED}", lat: 46.8182, lng: 8.2275 },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "\u{1F1EE}\u{1F1EA}", lat: 53.1424, lng: -7.6921 },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "\u{1F1E7}\u{1F1F7}", lat: -14.235, lng: -51.9253 },
  { name: "Jamaica", code: "JM", dialCode: "+1876", flag: "\u{1F1EF}\u{1F1F2}", lat: 18.1096, lng: -77.2975 },
  { name: "Trinidad and Tobago", code: "TT", dialCode: "+1868", flag: "\u{1F1F9}\u{1F1F9}", lat: 10.6918, lng: -61.2225 },
  { name: "Benin", code: "BJ", dialCode: "+229", flag: "\u{1F1E7}\u{1F1EF}", lat: 9.3077, lng: 2.3158 },
  { name: "Togo", code: "TG", dialCode: "+228", flag: "\u{1F1F9}\u{1F1EC}", lat: 8.6195, lng: 0.8248 },
  { name: "Liberia", code: "LR", dialCode: "+231", flag: "\u{1F1F1}\u{1F1F7}", lat: 6.4281, lng: -9.4295 },
  { name: "Sierra Leone", code: "SL", dialCode: "+232", flag: "\u{1F1F8}\u{1F1F1}", lat: 8.4606, lng: -11.7799 },
  { name: "Gambia", code: "GM", dialCode: "+220", flag: "\u{1F1EC}\u{1F1F2}", lat: 13.4432, lng: -15.3101 },
  { name: "China", code: "CN", dialCode: "+86", flag: "\u{1F1E8}\u{1F1F3}", lat: 35.8617, lng: 104.1954 },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "\u{1F1EF}\u{1F1F5}", lat: 36.2048, lng: 138.2529 },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "\u{1F1F8}\u{1F1EC}", lat: 1.3521, lng: 103.8198 },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "\u{1F1F2}\u{1F1FE}", lat: 4.2105, lng: 101.9758 },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "\u{1F1F3}\u{1F1FF}", lat: -40.9006, lng: 174.886 },
  { name: "Turkey", code: "TR", dialCode: "+90", flag: "\u{1F1F9}\u{1F1F7}", lat: 38.9637, lng: 35.2433 },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "\u{1F1F2}\u{1F1FD}", lat: 23.6345, lng: -102.5528 }
];

// src/data/locationData.ts
var COUNTRY_STATES_DATA = {
  NG: [
    { name: "Lagos", iso2: "LA", cities: ["Ikeja", "Lekki", "Victoria Island", "Surulere", "Yaba", "Ikoyi", "Maryland", "Festac", "Agege", "Ikorodu", "Ajah", "Oshodi", "Apapa"] },
    { name: "Abuja (FCT)", iso2: "FC", cities: ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Jabi", "Kubwa", "Lugbe", "Utako", "Apo", "Kado", "Central Business District"] },
    { name: "Rivers", iso2: "RI", cities: ["Port Harcourt", "Obio-Akpor", "Bonny", "Eleme", "Oyigbo", "Ikwerre", "Okrika"] },
    { name: "Oyo", iso2: "OY", cities: ["Ibadan", "Ogbomosho", "Oyo", "Iseyin", "Saki", "Eruwa"] },
    { name: "Kano", iso2: "KN", cities: ["Kano Municipal", "Fagge", "Dala", "Gwale", "Tarauni", "Nasarawa", "Kumbotso"] },
    { name: "Kaduna", iso2: "KD", cities: ["Kaduna", "Zaria", "Kafanchan", "Sabon Gari"] },
    { name: "Enugu", iso2: "EN", cities: ["Enugu", "Nsukka", "Udi", "Awgu", "Oji River"] },
    { name: "Anambra", iso2: "AN", cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Ihiala"] },
    { name: "Delta", iso2: "DE", cities: ["Asaba", "Warri", "Ughelli", "Sapele", "Agbor"] },
    { name: "Edo", iso2: "ED", cities: ["Benin City", "Auchi", "Ekpoma", "Uromi"] },
    { name: "Ogun", iso2: "OG", cities: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ota", "Ilaro"] },
    { name: "Abia", iso2: "AB", cities: ["Umuahia", "Aba", "Ohafia", "Arochukwu"] },
    { name: "Akwa Ibom", iso2: "AK", cities: ["Uyo", "Eket", "Ikot Ekpene", "Oron"] },
    { name: "Osun", iso2: "OS", cities: ["Osogbo", "Ile-Ife", "Ilesa", "Ede"] },
    { name: "Ondo", iso2: "ON", cities: ["Akure", "Ondo Town", "Owo", "Ikare"] },
    { name: "Kwara", iso2: "KW", cities: ["Ilorin", "Offa", "Omu-Aran", "Jebba"] },
    { name: "Plateau", iso2: "PL", cities: ["Jos", "Bukuru", "Pankshin", "Shendam"] },
    { name: "Cross River", iso2: "CR", cities: ["Calabar", "Ikom", "Ogoja", "Ugep"] },
    { name: "Imo", iso2: "IM", cities: ["Owerri", "Orlu", "Okigwe", "Mbaise"] },
    { name: "Benue", iso2: "BE", cities: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala"] },
    { name: "Adamawa", iso2: "AD", cities: ["Yola", "Mubi", "Jimeta", "Numan"] },
    { name: "Bauchi", iso2: "BA", cities: ["Bauchi", "Azare", "Misau", "Jama'are"] },
    { name: "Bayelsa", iso2: "BY", cities: ["Yenagoa", "Brass", "Ogbia", "Sagbama"] },
    { name: "Borno", iso2: "BO", cities: ["Maiduguri", "Biu", "Bama", "Dikwa"] },
    { name: "Ebonyi", iso2: "EB", cities: ["Abakaliki", "Afikpo", "Onueke"] },
    { name: "Ekiti", iso2: "EK", cities: ["Ado-Ekiti", "Ikere-Ekiti", "Ijero-Ekiti", "Oye-Ekiti"] },
    { name: "Gombe", iso2: "GO", cities: ["Gombe", "Kaltungo", "Billiri", "Dukku"] },
    { name: "Jigawa", iso2: "JI", cities: ["Dutse", "Hadejia", "Gumel", "Kazaure"] },
    { name: "Katsina", iso2: "KT", cities: ["Katsina", "Daura", "Funtua", "Malumfashi"] },
    { name: "Kebbi", iso2: "KE", cities: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"] },
    { name: "Kogi", iso2: "KO", cities: ["Lokoja", "Okene", "Kabba", "Idah"] },
    { name: "Nasarawa", iso2: "NA", cities: ["Lafia", "Keffi", "Akwanga", "Karu"] },
    { name: "Niger", iso2: "NI", cities: ["Minna", "Bida", "Suleja", "Kontagora"] },
    { name: "Sokoto", iso2: "SO", cities: ["Sokoto", "Wamakko", "Tambuwal"] },
    { name: "Taraba", iso2: "TA", cities: ["Jalingo", "Wukari", "Bali"] },
    { name: "Yobe", iso2: "YO", cities: ["Damaturu", "Potiskum", "Gashua"] },
    { name: "Zamfara", iso2: "ZA", cities: ["Gusau", "Kaura Namoda", "Talata Mafara"] }
  ],
  US: [
    { name: "New York", iso2: "NY", cities: ["New York City", "Brooklyn", "Queens", "Buffalo", "Rochester", "Albany", "Yonkers", "Syracuse"] },
    { name: "California", iso2: "CA", cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Beverly Hills"] },
    { name: "Texas", iso2: "TX", cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington"] },
    { name: "Georgia", iso2: "GA", cities: ["Atlanta", "Savannah", "Augusta", "Columbus", "Macon"] },
    { name: "Florida", iso2: "FL", cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Tallahassee"] },
    { name: "Illinois", iso2: "IL", cities: ["Chicago", "Aurora", "Naperville", "Rockford", "Springfield"] },
    { name: "Maryland", iso2: "MD", cities: ["Baltimore", "Bethesda", "Silver Spring", "Rockville", "Annapolis"] },
    { name: "District of Columbia", iso2: "DC", cities: ["Washington D.C."] }
  ],
  GB: [
    { name: "Greater London", iso2: "LND", cities: ["Central London", "Westminster", "Camden", "Greenwich", "Kensington & Chelsea", "Hackney", "Croydon"] },
    { name: "Greater Manchester", iso2: "MAN", cities: ["Manchester", "Salford", "Bolton", "Stockport", "Oldham"] },
    { name: "West Midlands", iso2: "WMD", cities: ["Birmingham", "Coventry", "Wolverhampton", "Solihull"] },
    { name: "West Yorkshire", iso2: "WYK", cities: ["Leeds", "Bradford", "Wakefield", "Huddersfield"] },
    { name: "Scotland", iso2: "SCT", cities: ["Glasgow", "Edinburgh", "Aberdeen", "Dundee"] },
    { name: "Wales", iso2: "WLS", cities: ["Cardiff", "Swansea", "Newport"] }
  ],
  GH: [
    { name: "Greater Accra", iso2: "AA", cities: ["Accra", "Tema", "Madina", "East Legon", "Osu", "Achimota", "Spintex"] },
    { name: "Ashanti", iso2: "AH", cities: ["Kumasi", "Obuasi", "Tafo", "Ejisu"] },
    { name: "Central", iso2: "CP", cities: ["Cape Coast", "Kasoa", "Winneba", "Mfantseman"] },
    { name: "Western", iso2: "WP", cities: ["Sekondi-Takoradi", "Tarkwa", "Axim"] },
    { name: "Eastern", iso2: "EP", cities: ["Koforidua", "Nsawam", "Nkawkaw"] }
  ],
  KE: [
    { name: "Nairobi", iso2: "30", cities: ["Nairobi Central", "Westlands", "Kilimani", "Karen", "Eastleigh", "Langata"] },
    { name: "Mombasa", iso2: "28", cities: ["Mombasa", "Nyali", "Likoni", "Kisauni"] },
    { name: "Kisumu", iso2: "20", cities: ["Kisumu Central", "Milimani", "Kondele"] },
    { name: "Nakuru", iso2: "31", cities: ["Nakuru Town", "Naivasha", "Njoro"] },
    { name: "Uasin Gishu", iso2: "44", cities: ["Eldoret", "Turbo"] }
  ],
  ZA: [
    { name: "Gauteng", iso2: "GT", cities: ["Johannesburg", "Pretoria", "Sandton", "Soweto", "Midrand", "Centurion", "Randburg"] },
    { name: "Western Cape", iso2: "WC", cities: ["Cape Town", "Stellenbosch", "George", "Paarl", "Bellville"] },
    { name: "KwaZulu-Natal", iso2: "NL", cities: ["Durban", "Pietermaritzburg", "Umhlanga", "Pinetown"] },
    { name: "Eastern Cape", iso2: "EC", cities: ["Gqeberha (Port Elizabeth)", "East London", "Mthatha"] }
  ],
  CA: [
    { name: "Ontario", iso2: "ON", cities: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "Markham"] },
    { name: "Quebec", iso2: "QC", cities: ["Montreal", "Quebec City", "Laval", "Gatineau"] },
    { name: "British Columbia", iso2: "BC", cities: ["Vancouver", "Surrey", "Burnaby", "Richmond", "Victoria"] },
    { name: "Alberta", iso2: "AB", cities: ["Calgary", "Edmonton", "Red Deer"] }
  ],
  AE: [
    { name: "Dubai", iso2: "DU", cities: ["Downtown Dubai", "Deira", "Bur Dubai", "Dubai Marina", "Jumeirah", "Business Bay"] },
    { name: "Abu Dhabi", iso2: "AZ", cities: ["Abu Dhabi City", "Al Ain", "Al Dhafra"] },
    { name: "Sharjah", iso2: "SH", cities: ["Sharjah City", "Al Majaz", "Al Nahda"] }
  ],
  FR: [
    { name: "\xCEle-de-France", iso2: "IDF", cities: ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Montreuil", "Versailles"] },
    { name: "Auvergne-Rh\xF4ne-Alpes", iso2: "ARA", cities: ["Lyon", "Saint-\xC9tienne", "Grenoble", "Villeurbanne"] },
    { name: "Provence-Alpes-C\xF4te d'Azur", iso2: "PAC", cities: ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Cannes"] }
  ],
  DE: [
    { name: "Berlin", iso2: "BE", cities: ["Berlin Mitte", "Charlottenburg", "Kreuzberg", "Neuk\xF6lln"] },
    { name: "Bavaria", iso2: "BY", cities: ["Munich", "Nuremberg", "Augsburg", "Regensburg"] },
    { name: "North Rhine-Westphalia", iso2: "NW", cities: ["Cologne", "D\xFCsseldorf", "Dortmund", "Essen", "Bonn"] },
    { name: "Hesse", iso2: "HE", cities: ["Frankfurt am Main", "Wiesbaden", "Kassel", "Darmstadt"] }
  ]
};
function getStaticStates(countryCode) {
  const code = countryCode.toUpperCase();
  if (COUNTRY_STATES_DATA[code]) {
    return COUNTRY_STATES_DATA[code];
  }
  const country = COUNTRIES.find((c) => c.code === code);
  const capital = country ? `${country.name} Central` : "Capital Region";
  return [
    { name: capital, iso2: `${code}1`, cities: ["Main District", "Central Metro"] },
    { name: `${country?.name || "Northern"} Province`, iso2: `${code}2`, cities: ["Urban Center"] },
    { name: `${country?.name || "Southern"} Province`, iso2: `${code}3`, cities: ["Metro Area"] }
  ];
}
function getStaticCities(countryCode, stateIsoOrName) {
  const states = getStaticStates(countryCode);
  const match = states.find(
    (s) => s.iso2.toLowerCase() === stateIsoOrName.toLowerCase() || s.name.toLowerCase() === stateIsoOrName.toLowerCase()
  );
  if (match && match.cities && match.cities.length > 0) {
    return match.cities;
  }
  return [
    `${stateIsoOrName} Central`,
    `${stateIsoOrName} Metro`,
    `${stateIsoOrName} City`
  ];
}

// server.ts
dotenv.config();
var AWS_REGION = process.env.AWS_REGION || "eu-north-1";
var BUCKET_NAME = process.env.AWS_BUCKET_NAME || "fabric-reality";
var ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var s3Client = null;
try {
  if (ACCESS_KEY_ID && SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY
      }
    });
  } else {
    console.warn("\x1B[33m%s\x1B[0m", "WARNING: AWS credentials not found in .env file. S3 uploads will be disabled.");
  }
} catch (err) {
  console.warn("S3 Client initialization note:", err);
}
var CSC_API_KEY = process.env.CSC_API_KEY;
var cscApi = axios.create({
  baseURL: "https://api.countrystatecity.in/v1",
  headers: { "X-CSCAPI-KEY": CSC_API_KEY }
});
if (!CSC_API_KEY) {
  console.warn("\x1B[33m%s\x1B[0m", "WARNING: CSC_API_KEY not found in .env file. Location services will be disabled.");
}
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var DATA_DIR = isServerless ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "db.json");
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("Note: Local data directory could not be created (using memory fallback):", err);
}
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading db file, initializing defaults:", err);
  }
  const defaultAdmin = {
    id: "admin_super_1",
    email: "fountainsdata234@gmail.com",
    password: "Obamhi234",
    name: "Super Admin",
    role: "admin",
    avatarUrl: "",
    country: "Nigeria",
    countryCode: "NG",
    phone: "+2348029772375",
    whatsappPhone: "+2348029772375",
    state: "Lagos",
    city: "Lagos",
    ratingAverage: 5,
    ratingCount: 0,
    followersCount: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const defaultPlans = [
    {
      id: "plan_starter",
      name: "Starter Visibility Booster",
      price: "\u20A615,000 / $15 (30 Days)",
      durationDays: 30,
      description: "Ideal for emerging tailors looking to get discovered in local city searches.",
      perks: [
        "Promoted Gold Badge on Profile & Clothes",
        "2x Search Frequency Boost",
        "Direct WhatsApp Inquiry Link",
        "Featured in Category Listings"
      ],
      isFeatured: false,
      badgeLabel: "VERIFIED PRO",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "plan_gold",
      name: "Spotlight Gold Tier",
      price: "\u20A635,000 / $35 (30 Days)",
      durationDays: 30,
      description: "The standard for busy fashion houses. Guaranteed top carousel placement.",
      perks: [
        "Top Homepage Hero Carousel Feature",
        "5x Search Algorithm Boost in Area",
        "Interactive Map Top Pin with Gold Halo",
        "Highlighted In-App Message Alerts",
        "Social Proof & Promotion Ribbon"
      ],
      isFeatured: true,
      badgeLabel: "FEATURED MASTER",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "plan_royal",
      name: "Royal Haute Couture Elite",
      price: "\u20A670,000 / $70 (60 Days)",
      durationDays: 60,
      description: "Ultimate visibility across international searches for high-ticket bespoke clients.",
      perks: [
        "Permanent Landing & Homepage Spotlight",
        "Global Tag Ranking (#1 on Agbada, Suits, Bridal)",
        "Dedicated WhatsApp VIP Lead Concierge (08029772375)",
        "Unlimited Collections & High-Res AWS S3 Gallery",
        "Custom Admin Verified Checkmark"
      ],
      isFeatured: false,
      badgeLabel: "ROYAL ELITE",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  const initialDb = {
    users: [defaultAdmin],
    garments: [],
    collections: [],
    reviews: [],
    messages: [
      {
        id: "msg_welcome_broadcast",
        senderId: "admin_super_1",
        senderName: "Fabric Reality Admin",
        senderRole: "admin",
        senderAvatar: "",
        recipientId: "all",
        text: "Welcome to Fabric Reality! Discover master bespoke tailors, explore authentic designs, and connect directly on WhatsApp & in-app chat.",
        isAnnouncement: true,
        targetAudience: "all",
        read: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ],
    promotionPlans: defaultPlans,
    adminLogs: [
      {
        id: "log_init",
        adminEmail: "fountainsdata234@gmail.com",
        action: "SYSTEM_INITIALIZED",
        target: "Fabric Reality Core",
        details: "Admin portal and AWS S3 storage initialized.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  };
  saveDatabase(initialDb);
  return initialDb;
}
async function saveDatabase(database) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), "utf-8");
  } catch (err) {
    console.warn("Note: Could not save db file to disk (in-memory mode):", err);
  }
  if (s3Client && BUCKET_NAME) {
    const s3Key = process.env.S3_DB_KEY || "db.json";
    const body = JSON.stringify(database, null, 2);
    const putParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: body,
      ContentType: "application/json"
    };
    try {
      await s3Client.send(new PutObjectCommand(putParams));
      lastS3SyncTime = Date.now();
      console.log("[S3 DB Save] Saved database snapshot to S3:", s3Key);
    } catch (err) {
      console.warn("[S3 DB Save] S3 persistence note:", err?.message || err);
    }
  }
}
var lastS3SyncTime = 0;
var S3_SYNC_INTERVAL_MS = 3e3;
async function syncDbFromS3(force = false) {
  const now = Date.now();
  if (!force && now - lastS3SyncTime < S3_SYNC_INTERVAL_MS) {
    return;
  }
  if (!s3Client || !BUCKET_NAME) return;
  const s3Key = process.env.S3_DB_KEY || "db.json";
  try {
    const getCmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const res = await s3Client.send(getCmd);
    const stream = res.Body;
    let data = "";
    if (stream && typeof stream.transformToString === "function") {
      data = await stream.transformToString();
    } else if (stream && typeof stream.on === "function") {
      for await (const chunk of stream) {
        data += chunk;
      }
    } else if (typeof stream === "string") {
      data = stream;
    }
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.users) && Array.isArray(parsed.garments)) {
        db = parsed;
        lastS3SyncTime = Date.now();
        console.log(`[S3 DB Sync] Synced ${db.garments.length} garments and ${db.users.length} users from S3`);
      }
    }
  } catch (err) {
    if (err?.name === "NoSuchKey" || err?.Code === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
      console.log("[S3 DB] No remote db.json found in S3 yet; initializing from defaults.");
      await saveDatabase(db);
    } else {
      console.warn("S3 DB Sync note:", err?.message || err);
    }
  }
}
async function tryLoadDbFromS3() {
  await syncDbFromS3(true);
}
var db = loadDatabase();
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(async (_req, _res, next) => {
  try {
    await syncDbFromS3();
  } catch (e) {
  }
  next();
});
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/assets") && !req.url.startsWith("/src")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});
app.get("/api/locations/countries", async (_req, res) => {
  if (CSC_API_KEY) {
    try {
      const response = await cscApi.get("/countries");
      const formatted = response.data.map((c) => ({
        name: c.name,
        code: c.iso2,
        dialCode: c.phonecode,
        flag: c.emoji,
        lat: c.latitude,
        lng: c.longitude
      }));
      return res.json(formatted);
    } catch (error) {
      console.warn("Country fetch note (using static list):", error.message);
    }
  }
  res.json(COUNTRIES);
});
app.get("/api/locations/states/:countryCode", async (req, res) => {
  const { countryCode } = req.params;
  if (CSC_API_KEY) {
    try {
      const response = await cscApi.get(`/countries/${countryCode}/states`);
      const formatted = response.data.map((s) => ({
        name: s.name,
        iso2: s.iso2
      })).sort((a, b) => a.name.localeCompare(b.name));
      return res.json(formatted);
    } catch (error) {
      console.warn(`State fetch note for ${countryCode} (using static list):`, error.message);
    }
  }
  const fallbackStates = getStaticStates(countryCode).map((s) => ({ name: s.name, iso2: s.iso2 }));
  res.json(fallbackStates);
});
app.get("/api/locations/cities/:countryCode/:stateIso", async (req, res) => {
  const { countryCode, stateIso } = req.params;
  if (CSC_API_KEY) {
    try {
      const response = await cscApi.get(`/countries/${countryCode}/states/${stateIso}/cities`);
      const formatted = response.data.map((c) => ({
        name: c.name
      })).sort((a, b) => a.name.localeCompare(b.name));
      return res.json(formatted);
    } catch (error) {
      console.warn(`City fetch note for ${countryCode}/${stateIso} (using static list):`, error.message);
    }
  }
  const fallbackCities = getStaticCities(countryCode, stateIso).map((name) => ({ name }));
  res.json(fallbackCities);
});
app.get("/api/locations/reverse-geocode", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const response = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    res.json({ countryCode: response.data.countryCode || "NG", city: response.data.city || "Lagos" });
  } catch (error) {
    res.json({ countryCode: "NG", city: "Lagos" });
  }
});
app.post("/api/upload", async (req, res) => {
  try {
    const { imageBase64, filename, contentType = "image/jpeg", folder = "garments" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let detectedType = contentType;
    if (matches && matches.length === 3) {
      detectedType = matches[1];
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(imageBase64, "base64");
    }
    const extension = detectedType.split("/")[1] || "jpg";
    const cleanName = (filename || `cloth_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "");
    const s3Key = `${folder}/${Date.now()}_${cleanName}.${extension}`;
    let publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
    let uploadedToS3 = false;
    if (s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: detectedType
        });
        await s3Client.send(command);
        uploadedToS3 = true;
      } catch (s3Err) {
        console.warn("Direct S3 Put warning (falling back to inline storage URL):", s3Err?.message || s3Err);
      }
    }
    const finalUrl = uploadedToS3 ? publicUrl : `data:${detectedType};base64,${buffer.toString("base64")}`;
    res.json({
      success: true,
      url: finalUrl,
      s3Key,
      uploadedToS3
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed: " + (err.message || err) });
  }
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role = "customer",
      country,
      countryCode,
      phone,
      whatsappPhone,
      state,
      city,
      streetAddress,
      specialties,
      bio,
      avatarUrl,
      pricingGuide,
      availability
    } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and full name are required." });
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }
    const phoneValidation = validatePhoneNumber(phone, countryCode);
    if (phone && !phoneValidation.valid) {
      return res.status(400).json({ error: "The provided phone number is not valid." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists. Please log in." });
    }
    const isSuperAdminEmail = cleanEmail === "fountainsdata234@gmail.com";
    const finalRole = isSuperAdminEmail ? "admin" : role;
    const newUser = {
      id: "usr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      email: cleanEmail,
      // SECURITY: Hash the password before saving
      password: await bcrypt.hash(password, 10),
      name: name.trim(),
      role: finalRole,
      avatarUrl: avatarUrl || "",
      bio: bio || (finalRole === "tailor" ? "Passionate master tailor delivering precise bespoke fits." : "Fashion enthusiast looking for authentic custom fits."),
      country: country || "Nigeria",
      countryCode: countryCode || "NG",
      phone: phone || "",
      whatsappPhone: whatsappPhone || phone || "",
      state: state || "",
      city: city || "",
      streetAddress: streetAddress || "",
      isBlocked: false,
      isPromoted: false,
      ratingAverage: 5,
      ratingCount: 0,
      followersCount: 0,
      followingIds: [],
      specialties: specialties || (finalRole === "tailor" ? ["Traditional", "Agbada", "Senator", "Suits"] : []),
      pricingGuide: pricingGuide || (finalRole === "tailor" ? [
        { service: "Bespoke Senator / Kaftan (2pc)", estimatedPrice: "\u20A615,000 - \u20A630,000", turnaround: "3-5 Days" },
        { service: "Grand 3-Piece Agbada", estimatedPrice: "\u20A635,000 - \u20A675,000", turnaround: "5-7 Days" },
        { service: "Tailored 2-Piece Suit", estimatedPrice: "\u20A640,000 - \u20A690,000", turnaround: "7-10 Days" }
      ] : []),
      availability: availability || "Mon - Sat: 9:00 AM - 7:00 PM",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.push(newUser);
    saveDatabase(db);
    const { password: _, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser, token: "jwt_" + newUser.id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === "fountainsdata234@gmail.com") {
      if (password !== (process.env.ADMIN_PASSWORD || "Obamhi234")) {
        return res.status(401).json({ error: "Invalid admin credentials." });
      }
      let adminUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!adminUser) {
        adminUser = {
          id: "admin_super_1",
          email: "fountainsdata234@gmail.com",
          password: await bcrypt.hash(process.env.ADMIN_PASSWORD || "Obamhi234", 10),
          name: "Super Admin",
          role: "admin",
          avatarUrl: "",
          country: "Nigeria",
          countryCode: "NG",
          phone: "+2348029772375",
          whatsappPhone: "+2348029772375",
          state: "Lagos",
          city: "Lagos",
          ratingAverage: 5,
          ratingCount: 0,
          followersCount: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.users.push(adminUser);
        saveDatabase(db);
      } else {
        adminUser.role = "admin";
      }
      const { password: _2, ...safeAdmin } = adminUser;
      return res.json({ success: true, user: safeAdmin, token: "jwt_" + adminUser.id });
    }
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user && !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: "Your account has been temporarily blocked by administration. Please contact support at 08029772375." });
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: "jwt_" + user.id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});
app.put("/api/users/profile", async (req, res) => {
  try {
    const { userId, avatarUrl, bio, phone, whatsappPhone, state, city, streetAddress, specialties, pricingGuide, availability } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isBlocked && user.role === "tailor") {
      return res.status(403).json({ error: "Your account has been suspended. Profile updates are disabled. Contact support at 08029772375." });
    }
    if (avatarUrl !== void 0) user.avatarUrl = avatarUrl;
    if (bio !== void 0) user.bio = bio;
    if (phone !== void 0) user.phone = phone;
    if (whatsappPhone !== void 0) user.whatsappPhone = whatsappPhone;
    if (state !== void 0) user.state = state;
    if (city !== void 0) user.city = city;
    if (streetAddress !== void 0) user.streetAddress = streetAddress;
    if (specialties !== void 0) user.specialties = specialties;
    if (pricingGuide !== void 0) user.pricingGuide = pricingGuide;
    if (availability !== void 0) user.availability = availability;
    if (user.role === "tailor") {
      db.garments.forEach((g) => {
        if (g.tailorId === user.id) {
          g.tailorAvatar = user.avatarUrl;
          g.tailorPhone = user.phone;
          g.tailorWhatsapp = user.whatsappPhone;
          g.tailorCity = user.city;
          g.tailorState = user.state;
        }
      });
    }
    await saveDatabase(db);
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});
app.get("/api/tailors", (req, res) => {
  try {
    const { country, state, city, search, tag, promotedOnly } = req.query;
    let tailors = db.users.filter((u) => u.role === "tailor" && !u.isBlocked);
    if (promotedOnly === "true") {
      tailors = tailors.filter((t) => t.isPromoted);
    }
    if (country) {
      tailors = tailors.filter((t) => t.country?.toLowerCase() === String(country).toLowerCase());
    }
    if (city) {
      tailors = tailors.filter((t) => t.city?.toLowerCase().includes(String(city).toLowerCase()));
    }
    if (state) {
      tailors = tailors.filter((t) => t.state?.toLowerCase().includes(String(state).toLowerCase()));
    }
    if (tag) {
      const queryTag = String(tag).toLowerCase();
      tailors = tailors.filter(
        (t) => t.specialties?.some((s) => s.toLowerCase().includes(queryTag))
      );
    }
    if (search) {
      const q = String(search).toLowerCase();
      tailors = tailors.filter(
        (t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.state.toLowerCase().includes(q) || t.country.toLowerCase().includes(q) || t.bio?.toLowerCase().includes(q) || t.specialties?.some((s) => s.toLowerCase().includes(q))
      );
    }
    tailors.sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      if (b.ratingAverage !== a.ratingAverage) return b.ratingAverage - a.ratingAverage;
      return (b.followersCount || 0) - (a.followersCount || 0);
    });
    const safeTailors = tailors.map(({ password: _, ...t }) => t);
    res.json({ success: true, tailors: safeTailors });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tailors" });
  }
});
app.get("/api/tailors/:id", (req, res) => {
  try {
    const tailor = db.users.find((u) => u.id === req.params.id && u.role === "tailor");
    if (!tailor) {
      return res.status(404).json({ error: "Tailor not found" });
    }
    const garments = db.garments.filter((g) => g.tailorId === tailor.id);
    const collections = db.collections.filter((c) => c.tailorId === tailor.id);
    const reviews = db.reviews.filter((r) => r.tailorId === tailor.id);
    const { password: _, ...safeTailor } = tailor;
    res.json({
      success: true,
      tailor: safeTailor,
      garments,
      collections,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tailor profile" });
  }
});
app.get("/api/garments", (req, res) => {
  try {
    const { tag, category, gender, search, tailorId, sort = "trending" } = req.query;
    const blockedTailorIds = new Set(
      db.users.filter((u) => u.isBlocked).map((u) => u.id)
    );
    let garments = db.garments.filter((g) => !blockedTailorIds.has(g.tailorId));
    if (tailorId) {
      garments = garments.filter((g) => g.tailorId === String(tailorId));
    }
    if (tag) {
      const queryTag = String(tag).toLowerCase().trim();
      garments = garments.filter(
        (g) => g.tags?.some((t) => t.toLowerCase() === queryTag || t.toLowerCase().includes(queryTag))
      );
    }
    if (category && category !== "All Categories") {
      garments = garments.filter((g) => g.category?.toLowerCase() === String(category).toLowerCase());
    }
    if (gender && gender !== "All") {
      garments = garments.filter((g) => g.gender === gender || g.gender === "Unisex");
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      garments = garments.filter(
        (g) => g.title?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q) || g.tailorName?.toLowerCase().includes(q) || g.tailorCity?.toLowerCase().includes(q) || g.tailorCountry?.toLowerCase().includes(q) || g.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === "trending") {
      garments.sort((a, b) => {
        if (a.tailorIsPromoted && !b.tailorIsPromoted) return -1;
        if (!a.tailorIsPromoted && b.tailorIsPromoted) return 1;
        const scoreA = (a.averageRating || 5) * 10 + (a.likesCount || 0) * 2;
        const scoreB = (b.averageRating || 5) * 10 + (b.likesCount || 0) * 2;
        return scoreB - scoreA;
      });
    } else if (sort === "latest") {
      garments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "top_rated") {
      garments.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sort === "price_low") {
      garments.sort((a, b) => a.price - b.price);
    } else if (sort === "price_high") {
      garments.sort((a, b) => b.price - a.price);
    }
    res.json({ success: true, garments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch garments" });
  }
});
app.post("/api/garments", async (req, res) => {
  try {
    const {
      tailorId,
      title,
      description,
      tags = [],
      price,
      currency = "\u20A6",
      category = "Traditional",
      gender = "Unisex",
      fabricType = "Cotton / Wool Blend",
      turnaroundDays = 5,
      imageUrl,
      s3Key,
      collectionId
    } = req.body;
    if (!tailorId || !title || !imageUrl) {
      return res.status(400).json({ error: "Tailor ID, garment title, and image are required." });
    }
    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) {
      return res.status(404).json({ error: "Tailor not found" });
    }
    if (tailor.isBlocked) {
      return res.status(403).json({ error: "Your account has been suspended by administration. You cannot post new garments. Contact support at 08029772375." });
    }
    const processedTags = Array.isArray(tags) ? tags.map((t) => t.toLowerCase().trim()).filter(Boolean) : String(tags).split(",").map((t) => t.toLowerCase().trim()).filter(Boolean);
    let collectionName = "";
    if (collectionId) {
      const col = db.collections.find((c) => c.id === collectionId);
      if (col) {
        collectionName = col.title;
        col.itemCount = (col.itemCount || 0) + 1;
      }
    }
    const newGarment = {
      id: "garment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      tailorId: tailor.id,
      tailorName: tailor.name,
      tailorAvatar: tailor.avatarUrl,
      tailorCountry: tailor.country,
      tailorCity: tailor.city,
      tailorState: tailor.state,
      tailorPhone: tailor.phone,
      tailorWhatsapp: tailor.whatsappPhone || tailor.phone,
      tailorIsPromoted: !!tailor.isPromoted,
      title: title.trim(),
      description: description || "",
      tags: processedTags,
      price: Number(price) || 0,
      currency: currency || "\u20A6",
      category,
      gender,
      fabricType,
      turnaroundDays: Number(turnaroundDays) || 5,
      imageUrl,
      s3Key: s3Key || "",
      collectionId: collectionId || "",
      collectionName,
      likesCount: 0,
      viewsCount: 1,
      ratingsCount: 0,
      averageRating: 5,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.garments.unshift(newGarment);
    await saveDatabase(db);
    res.json({ success: true, garment: newGarment });
  } catch (err) {
    console.error("Create garment error:", err);
    res.status(500).json({ error: "Failed to create garment" });
  }
});
app.delete("/api/garments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { requesterId, requesterRole } = req.body;
    const garmentIndex = db.garments.findIndex((g) => g.id === id);
    if (garmentIndex === -1) {
      return res.status(404).json({ error: "Garment not found" });
    }
    const garment = db.garments[garmentIndex];
    if (requesterRole !== "admin" && garment.tailorId !== requesterId) {
      return res.status(403).json({ error: "Unauthorized to delete this garment" });
    }
    db.garments.splice(garmentIndex, 1);
    if (requesterRole === "admin") {
      db.adminLogs.push({
        id: "log_" + Date.now(),
        adminEmail: "fountainsdata234@gmail.com",
        action: "DELETE_GARMENT",
        target: garment.title,
        details: `Garment ${garment.id} deleted by admin`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    await saveDatabase(db);
    res.json({ success: true, message: "Garment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete garment" });
  }
});
app.post("/api/collections", async (req, res) => {
  try {
    const { tailorId, title, description, bannerUrl } = req.body;
    if (!tailorId || !title) {
      return res.status(400).json({ error: "Tailor ID and Collection Title are required" });
    }
    const collectionOwner = db.users.find((u) => u.id === tailorId);
    if (collectionOwner?.isBlocked) {
      return res.status(403).json({ error: "Your account has been suspended. You cannot create collections. Contact support at 08029772375." });
    }
    const newCollection = {
      id: "col_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      tailorId,
      title: title.trim(),
      description: description || "",
      bannerUrl: bannerUrl || "",
      itemCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.collections.push(newCollection);
    await saveDatabase(db);
    res.json({ success: true, collection: newCollection });
  } catch (err) {
    res.status(500).json({ error: "Failed to create collection" });
  }
});
app.post("/api/reviews", async (req, res) => {
  try {
    const { garmentId, tailorId, customerId, rating, comment } = req.body;
    if (!customerId || !tailorId || !rating) {
      return res.status(400).json({ error: "Customer ID, tailor ID, and rating (1-5) are required" });
    }
    const customer = db.users.find((u) => u.id === customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) {
      return res.status(404).json({ error: "Tailor not found" });
    }
    let garmentTitle = "";
    if (garmentId) {
      const garment = db.garments.find((g) => g.id === garmentId);
      if (garment) {
        garmentTitle = garment.title;
        const currentGarmentRatings = db.reviews.filter((r) => r.garmentId === garmentId);
        const newGarmentCount = currentGarmentRatings.length + 1;
        const newGarmentAvg = (currentGarmentRatings.reduce((sum, r) => sum + r.rating, 0) + Number(rating)) / newGarmentCount;
        garment.ratingsCount = newGarmentCount;
        garment.averageRating = Number(newGarmentAvg.toFixed(1));
      }
    }
    const newReview = {
      id: "rev_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      garmentId: garmentId || "",
      tailorId,
      customerId: customer.id,
      customerName: customer.name,
      customerAvatar: customer.avatarUrl,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment || "Excellent craftsmanship and perfect fit!",
      garmentTitle,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.reviews.unshift(newReview);
    const tailorReviews = db.reviews.filter((r) => r.tailorId === tailorId);
    const totalRatings = tailorReviews.reduce((sum, r) => sum + r.rating, 0);
    tailor.ratingCount = tailorReviews.length;
    tailor.ratingAverage = Number((totalRatings / tailorReviews.length).toFixed(1));
    await saveDatabase(db);
    res.json({ success: true, review: newReview, tailorRating: tailor.ratingAverage });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});
app.post("/api/followers/toggle", async (req, res) => {
  try {
    const { followerId, targetTailorId } = req.body;
    const follower = db.users.find((u) => u.id === followerId);
    const tailor = db.users.find((u) => u.id === targetTailorId);
    if (!follower || !tailor) {
      return res.status(404).json({ error: "User or Tailor not found" });
    }
    if (!follower.followingIds) follower.followingIds = [];
    const isFollowing = follower.followingIds.includes(targetTailorId);
    if (isFollowing) {
      follower.followingIds = follower.followingIds.filter((id) => id !== targetTailorId);
      tailor.followersCount = Math.max(0, (tailor.followersCount || 0) - 1);
    } else {
      follower.followingIds.push(targetTailorId);
      tailor.followersCount = (tailor.followersCount || 0) + 1;
    }
    await saveDatabase(db);
    res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: tailor.followersCount,
      followingIds: follower.followingIds
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle follow status" });
  }
});
app.post("/api/garments/like", async (req, res) => {
  try {
    const { garmentId, increment = true } = req.body;
    const garment = db.garments.find((g) => g.id === garmentId);
    if (!garment) {
      return res.status(404).json({ error: "Garment not found" });
    }
    if (increment) {
      garment.likesCount = (garment.likesCount || 0) + 1;
    } else {
      garment.likesCount = Math.max(0, (garment.likesCount || 0) - 1);
    }
    await saveDatabase(db);
    res.json({ success: true, likesCount: garment.likesCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to like garment" });
  }
});
app.get("/api/messages", (req, res) => {
  try {
    const { userId, otherUserId } = req.query;
    const user = db.users.find((u) => u.id === userId);
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    let userMessages = db.messages.filter((m) => {
      if (m.isAnnouncement) {
        if (m.targetAudience === "all") return true;
        if (m.targetAudience === "tailors" && user?.role === "tailor") return true;
        if (m.targetAudience === "customers" && user?.role === "customer") return true;
        return false;
      }
      if (otherUserId) {
        return m.senderId === userId && m.recipientId === otherUserId || m.senderId === otherUserId && m.recipientId === userId;
      }
      return m.senderId === userId || m.recipientId === userId;
    });
    res.json({ success: true, messages: userMessages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
app.post("/api/messages", async (req, res) => {
  try {
    const {
      senderId,
      recipientId,
      text,
      garmentId,
      garmentTitle,
      garmentImage,
      isAnnouncement,
      targetAudience = "direct"
    } = req.body;
    if (!senderId || !text) {
      return res.status(400).json({ error: "Sender ID and message text are required" });
    }
    const sender = db.users.find((u) => u.id === senderId);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }
    let recipientName = "Public";
    if (recipientId && !["all", "tailors", "customers"].includes(recipientId)) {
      const recipient = db.users.find((u) => u.id === recipientId);
      if (recipient) recipientName = recipient.name;
    }
    const newMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatar: sender.avatarUrl,
      recipientId: recipientId || "all",
      recipientName,
      text: text.trim(),
      garmentId: garmentId || "",
      garmentTitle: garmentTitle || "",
      garmentImage: garmentImage || "",
      isAnnouncement: !!isAnnouncement,
      targetAudience: isAnnouncement ? targetAudience : "direct",
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.messages.push(newMessage);
    await saveDatabase(db);
    res.json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});
app.get("/api/promotions", (_req, res) => {
  res.json({ success: true, plans: db.promotionPlans });
});
app.post("/api/admin/tailors/block", async (req, res) => {
  try {
    const { tailorId, isBlocked, adminEmail } = req.body;
    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) return res.status(404).json({ error: "Tailor not found" });
    tailor.isBlocked = !!isBlocked;
    if (isBlocked) {
      tailor.isPromoted = false;
      tailor.promotionPlanName = void 0;
    }
    db.garments.forEach((g) => {
      if (g.tailorId === tailorId) {
        g.tailorIsPromoted = isBlocked ? false : !!tailor.isPromoted;
      }
    });
    db.adminLogs.push({
      id: "log_" + Date.now(),
      adminEmail: adminEmail || "fountainsdata234@gmail.com",
      action: isBlocked ? "BLOCK_TAILOR" : "UNBLOCK_TAILOR",
      target: tailor.name + ` (${tailor.email})`,
      details: isBlocked ? "Tailor account SUSPENDED: login, garment posting, and collections blocked" : "Tailor account REINSTATED: all access restored",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    await saveDatabase(db);
    res.json({ success: true, isBlocked: tailor.isBlocked, message: isBlocked ? `${tailor.name} has been suspended.` : `${tailor.name} has been reinstated.` });
  } catch (err) {
    res.status(500).json({ error: "Admin action failed" });
  }
});
app.post("/api/admin/tailors/delete", async (req, res) => {
  try {
    const { tailorId, adminEmail } = req.body;
    const tailorIndex = db.users.findIndex((u) => u.id === tailorId);
    if (tailorIndex === -1) return res.status(404).json({ error: "Tailor not found" });
    const tailor = db.users[tailorIndex];
    db.users.splice(tailorIndex, 1);
    db.garments = db.garments.filter((g) => g.tailorId !== tailorId);
    db.adminLogs.push({
      id: "log_" + Date.now(),
      adminEmail: adminEmail || "fountainsdata234@gmail.com",
      action: "DELETE_TAILOR",
      target: tailor.name + ` (${tailor.email})`,
      details: "Tailor account and all associated garments removed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    await saveDatabase(db);
    res.json({ success: true, message: "Tailor removed" });
  } catch (err) {
    res.status(500).json({ error: "Delete tailor failed" });
  }
});
app.post("/api/admin/promote-tailor", async (req, res) => {
  try {
    const { tailorId, isPromoted, planName, adminEmail } = req.body;
    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) return res.status(404).json({ error: "Tailor not found" });
    tailor.isPromoted = !!isPromoted;
    tailor.promotionPlanName = isPromoted ? planName || "Spotlight Gold Tier" : void 0;
    db.garments.forEach((g) => {
      if (g.tailorId === tailorId) {
        g.tailorIsPromoted = !!isPromoted;
      }
    });
    db.adminLogs.push({
      id: "log_" + Date.now(),
      adminEmail: adminEmail || "fountainsdata234@gmail.com",
      action: isPromoted ? "PROMOTE_TAILOR" : "REMOVE_PROMOTION",
      target: tailor.name,
      details: isPromoted ? `Promoted under ${planName || "Spotlight"}` : "Promotion deactivated",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    await saveDatabase(db);
    res.json({ success: true, isPromoted: tailor.isPromoted });
  } catch (err) {
    res.status(500).json({ error: "Promotion update failed" });
  }
});
app.post("/api/admin/promotions", async (req, res) => {
  try {
    const { name, price, durationDays, description, perks, badgeLabel, adminEmail } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Plan name and price are required" });
    }
    const newPlan = {
      id: "plan_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      price: price.trim(),
      durationDays: Number(durationDays) || 30,
      description: description || "Special tailor promotion package with enhanced reach.",
      perks: Array.isArray(perks) ? perks : String(perks).split("\n").filter(Boolean),
      badgeLabel: badgeLabel || "FEATURED",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.promotionPlans.unshift(newPlan);
    db.adminLogs.push({
      id: "log_" + Date.now(),
      adminEmail: adminEmail || "fountainsdata234@gmail.com",
      action: "CREATE_PROMOTION_PLAN",
      target: newPlan.name,
      details: `Plan created with price ${newPlan.price}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    await saveDatabase(db);
    res.json({ success: true, plan: newPlan });
  } catch (err) {
    res.status(500).json({ error: "Create promotion plan failed" });
  }
});
app.post("/api/admin/add-admin", async (req, res) => {
  try {
    const { email, name, password, adminEmail } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, name, and password are required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.role = "admin";
      await saveDatabase(db);
      return res.json({ success: true, message: "Existing user elevated to Admin role" });
    }
    const newAdmin = {
      id: "admin_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      email: cleanEmail,
      password,
      name: name.trim(),
      role: "admin",
      avatarUrl: "",
      country: "Nigeria",
      countryCode: "NG",
      phone: "+2348029772375",
      state: "Lagos",
      city: "Lagos",
      ratingAverage: 5,
      ratingCount: 0,
      followersCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.users.push(newAdmin);
    db.adminLogs.push({
      id: "log_" + Date.now(),
      adminEmail: adminEmail || "fountainsdata234@gmail.com",
      action: "ADD_ADMIN",
      target: cleanEmail,
      details: `Appointed ${name} as Co-Admin`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    await saveDatabase(db);
    res.json({ success: true, message: "New Admin added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Add admin failed" });
  }
});
app.get("/api/admin/dashboard", (_req, res) => {
  try {
    const totalTailors = db.users.filter((u) => u.role === "tailor").length;
    const totalCustomers = db.users.filter((u) => u.role === "customer").length;
    const totalGarments = db.garments.length;
    const totalReviews = db.reviews.length;
    const totalPromotedTailors = db.users.filter((u) => u.role === "tailor" && u.isPromoted).length;
    res.json({
      success: true,
      stats: {
        totalTailors,
        totalCustomers,
        totalGarments,
        totalReviews,
        totalPromotedTailors
      },
      users: db.users.map(({ password: _, ...u }) => u),
      garments: db.garments,
      logs: db.adminLogs.slice(0, 50),
      plans: db.promotionPlans
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});
async function startLocalServer() {
  const PORT = Number(process.env.PORT) || 3001;
  try {
    await tryLoadDbFromS3();
  } catch (err) {
    console.warn("S3 DB load on startup failed:", err);
  }
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fabric Reality Server running at http://localhost:${PORT}`);
  });
}
app.get("/api/health", (_req, res) => {
  res.json({ success: true, environment: process.env.NODE_ENV || "development" });
});
app.get("/api/admin/db", (req, res) => {
  const adminEmail = String(req.query.adminEmail || "");
  const allowed = process.env.DEBUG_ADMIN_EMAIL || "fountainsdata234@gmail.com";
  if (adminEmail !== allowed) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }
  res.json({ success: true, db });
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  res.status(err?.status || 500).json({ success: false, error: err?.message || "Internal Server Error" });
});
if (process.env.NODE_ENV !== "production") {
  startLocalServer().catch((err) => {
    console.error("Failed to start local server:", err);
  });
}
var server_default = app;
export {
  server_default as default
};
