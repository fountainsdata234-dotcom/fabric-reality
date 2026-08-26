import { COUNTRIES } from './countries';

export interface StateData {
  name: string;
  iso2: string;
  cities: string[];
}

export const COUNTRY_STATES_DATA: Record<string, StateData[]> = {
  NG: [
    { name: 'Lagos', iso2: 'LA', cities: ['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Yaba', 'Ikoyi', 'Maryland', 'Festac', 'Agege', 'Ikorodu', 'Ajah', 'Oshodi', 'Apapa'] },
    { name: 'Abuja (FCT)', iso2: 'FC', cities: ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Jabi', 'Kubwa', 'Lugbe', 'Utako', 'Apo', 'Kado', 'Central Business District'] },
    { name: 'Rivers', iso2: 'RI', cities: ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Eleme', 'Oyigbo', 'Ikwerre', 'Okrika'] },
    { name: 'Oyo', iso2: 'OY', cities: ['Ibadan', 'Ogbomosho', 'Oyo', 'Iseyin', 'Saki', 'Eruwa'] },
    { name: 'Kano', iso2: 'KN', cities: ['Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nasarawa', 'Kumbotso'] },
    { name: 'Kaduna', iso2: 'KD', cities: ['Kaduna', 'Zaria', 'Kafanchan', 'Sabon Gari'] },
    { name: 'Enugu', iso2: 'EN', cities: ['Enugu', 'Nsukka', 'Udi', 'Awgu', 'Oji River'] },
    { name: 'Anambra', iso2: 'AN', cities: ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Ihiala'] },
    { name: 'Delta', iso2: 'DE', cities: ['Asaba', 'Warri', 'Ughelli', 'Sapele', 'Agbor'] },
    { name: 'Edo', iso2: 'ED', cities: ['Benin City', 'Auchi', 'Ekpoma', 'Uromi'] },
    { name: 'Ogun', iso2: 'OG', cities: ['Abeokuta', 'Ijebu Ode', 'Sagamu', 'Ota', 'Ilaro'] },
    { name: 'Abia', iso2: 'AB', cities: ['Umuahia', 'Aba', 'Ohafia', 'Arochukwu'] },
    { name: 'Akwa Ibom', iso2: 'AK', cities: ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron'] },
    { name: 'Osun', iso2: 'OS', cities: ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede'] },
    { name: 'Ondo', iso2: 'ON', cities: ['Akure', 'Ondo Town', 'Owo', 'Ikare'] },
    { name: 'Kwara', iso2: 'KW', cities: ['Ilorin', 'Offa', 'Omu-Aran', 'Jebba'] },
    { name: 'Plateau', iso2: 'PL', cities: ['Jos', 'Bukuru', 'Pankshin', 'Shendam'] },
    { name: 'Cross River', iso2: 'CR', cities: ['Calabar', 'Ikom', 'Ogoja', 'Ugep'] },
    { name: 'Imo', iso2: 'IM', cities: ['Owerri', 'Orlu', 'Okigwe', 'Mbaise'] },
    { name: 'Benue', iso2: 'BE', cities: ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala'] },
    { name: 'Adamawa', iso2: 'AD', cities: ['Yola', 'Mubi', 'Jimeta', 'Numan'] },
    { name: 'Bauchi', iso2: 'BA', cities: ['Bauchi', 'Azare', 'Misau', 'Jama\'are'] },
    { name: 'Bayelsa', iso2: 'BY', cities: ['Yenagoa', 'Brass', 'Ogbia', 'Sagbama'] },
    { name: 'Borno', iso2: 'BO', cities: ['Maiduguri', 'Biu', 'Bama', 'Dikwa'] },
    { name: 'Ebonyi', iso2: 'EB', cities: ['Abakaliki', 'Afikpo', 'Onueke'] },
    { name: 'Ekiti', iso2: 'EK', cities: ['Ado-Ekiti', 'Ikere-Ekiti', 'Ijero-Ekiti', 'Oye-Ekiti'] },
    { name: 'Gombe', iso2: 'GO', cities: ['Gombe', 'Kaltungo', 'Billiri', 'Dukku'] },
    { name: 'Jigawa', iso2: 'JI', cities: ['Dutse', 'Hadejia', 'Gumel', 'Kazaure'] },
    { name: 'Katsina', iso2: 'KT', cities: ['Katsina', 'Daura', 'Funtua', 'Malumfashi'] },
    { name: 'Kebbi', iso2: 'KE', cities: ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru'] },
    { name: 'Kogi', iso2: 'KO', cities: ['Lokoja', 'Okene', 'Kabba', 'Idah'] },
    { name: 'Nasarawa', iso2: 'NA', cities: ['Lafia', 'Keffi', 'Akwanga', 'Karu'] },
    { name: 'Niger', iso2: 'NI', cities: ['Minna', 'Bida', 'Suleja', 'Kontagora'] },
    { name: 'Sokoto', iso2: 'SO', cities: ['Sokoto', 'Wamakko', 'Tambuwal'] },
    { name: 'Taraba', iso2: 'TA', cities: ['Jalingo', 'Wukari', 'Bali'] },
    { name: 'Yobe', iso2: 'YO', cities: ['Damaturu', 'Potiskum', 'Gashua'] },
    { name: 'Zamfara', iso2: 'ZA', cities: ['Gusau', 'Kaura Namoda', 'Talata Mafara'] }
  ],
  US: [
    { name: 'New York', iso2: 'NY', cities: ['New York City', 'Brooklyn', 'Queens', 'Buffalo', 'Rochester', 'Albany', 'Yonkers', 'Syracuse'] },
    { name: 'California', iso2: 'CA', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Oakland', 'Beverly Hills'] },
    { name: 'Texas', iso2: 'TX', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington'] },
    { name: 'Georgia', iso2: 'GA', cities: ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'] },
    { name: 'Florida', iso2: 'FL', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Tallahassee'] },
    { name: 'Illinois', iso2: 'IL', cities: ['Chicago', 'Aurora', 'Naperville', 'Rockford', 'Springfield'] },
    { name: 'Maryland', iso2: 'MD', cities: ['Baltimore', 'Bethesda', 'Silver Spring', 'Rockville', 'Annapolis'] },
    { name: 'District of Columbia', iso2: 'DC', cities: ['Washington D.C.'] }
  ],
  GB: [
    { name: 'Greater London', iso2: 'LND', cities: ['Central London', 'Westminster', 'Camden', 'Greenwich', 'Kensington & Chelsea', 'Hackney', 'Croydon'] },
    { name: 'Greater Manchester', iso2: 'MAN', cities: ['Manchester', 'Salford', 'Bolton', 'Stockport', 'Oldham'] },
    { name: 'West Midlands', iso2: 'WMD', cities: ['Birmingham', 'Coventry', 'Wolverhampton', 'Solihull'] },
    { name: 'West Yorkshire', iso2: 'WYK', cities: ['Leeds', 'Bradford', 'Wakefield', 'Huddersfield'] },
    { name: 'Scotland', iso2: 'SCT', cities: ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee'] },
    { name: 'Wales', iso2: 'WLS', cities: ['Cardiff', 'Swansea', 'Newport'] }
  ],
  GH: [
    { name: 'Greater Accra', iso2: 'AA', cities: ['Accra', 'Tema', 'Madina', 'East Legon', 'Osu', 'Achimota', 'Spintex'] },
    { name: 'Ashanti', iso2: 'AH', cities: ['Kumasi', 'Obuasi', 'Tafo', 'Ejisu'] },
    { name: 'Central', iso2: 'CP', cities: ['Cape Coast', 'Kasoa', 'Winneba', 'Mfantseman'] },
    { name: 'Western', iso2: 'WP', cities: ['Sekondi-Takoradi', 'Tarkwa', 'Axim'] },
    { name: 'Eastern', iso2: 'EP', cities: ['Koforidua', 'Nsawam', 'Nkawkaw'] }
  ],
  KE: [
    { name: 'Nairobi', iso2: '30', cities: ['Nairobi Central', 'Westlands', 'Kilimani', 'Karen', 'Eastleigh', 'Langata'] },
    { name: 'Mombasa', iso2: '28', cities: ['Mombasa', 'Nyali', 'Likoni', 'Kisauni'] },
    { name: 'Kisumu', iso2: '20', cities: ['Kisumu Central', 'Milimani', 'Kondele'] },
    { name: 'Nakuru', iso2: '31', cities: ['Nakuru Town', 'Naivasha', 'Njoro'] },
    { name: 'Uasin Gishu', iso2: '44', cities: ['Eldoret', 'Turbo'] }
  ],
  ZA: [
    { name: 'Gauteng', iso2: 'GT', cities: ['Johannesburg', 'Pretoria', 'Sandton', 'Soweto', 'Midrand', 'Centurion', 'Randburg'] },
    { name: 'Western Cape', iso2: 'WC', cities: ['Cape Town', 'Stellenbosch', 'George', 'Paarl', 'Bellville'] },
    { name: 'KwaZulu-Natal', iso2: 'NL', cities: ['Durban', 'Pietermaritzburg', 'Umhlanga', 'Pinetown'] },
    { name: 'Eastern Cape', iso2: 'EC', cities: ['Gqeberha (Port Elizabeth)', 'East London', 'Mthatha'] }
  ],
  CA: [
    { name: 'Ontario', iso2: 'ON', cities: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'Markham'] },
    { name: 'Quebec', iso2: 'QC', cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau'] },
    { name: 'British Columbia', iso2: 'BC', cities: ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Victoria'] },
    { name: 'Alberta', iso2: 'AB', cities: ['Calgary', 'Edmonton', 'Red Deer'] }
  ],
  AE: [
    { name: 'Dubai', iso2: 'DU', cities: ['Downtown Dubai', 'Deira', 'Bur Dubai', 'Dubai Marina', 'Jumeirah', 'Business Bay'] },
    { name: 'Abu Dhabi', iso2: 'AZ', cities: ['Abu Dhabi City', 'Al Ain', 'Al Dhafra'] },
    { name: 'Sharjah', iso2: 'SH', cities: ['Sharjah City', 'Al Majaz', 'Al Nahda'] }
  ],
  FR: [
    { name: 'Île-de-France', iso2: 'IDF', cities: ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Montreuil', 'Versailles'] },
    { name: 'Auvergne-Rhône-Alpes', iso2: 'ARA', cities: ['Lyon', 'Saint-Étienne', 'Grenoble', 'Villeurbanne'] },
    { name: 'Provence-Alpes-Côte d\'Azur', iso2: 'PAC', cities: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Cannes'] }
  ],
  DE: [
    { name: 'Berlin', iso2: 'BE', cities: ['Berlin Mitte', 'Charlottenburg', 'Kreuzberg', 'Neukölln'] },
    { name: 'Bavaria', iso2: 'BY', cities: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg'] },
    { name: 'North Rhine-Westphalia', iso2: 'NW', cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Bonn'] },
    { name: 'Hesse', iso2: 'HE', cities: ['Frankfurt am Main', 'Wiesbaden', 'Kassel', 'Darmstadt'] }
  ]
};

export function getStaticStates(countryCode: string): StateData[] {
  const code = countryCode.toUpperCase();
  if (COUNTRY_STATES_DATA[code]) {
    return COUNTRY_STATES_DATA[code];
  }
  const country = COUNTRIES.find(c => c.code === code);
  const capital = country ? `${country.name} Central` : 'Capital Region';
  return [
    { name: capital, iso2: `${code}1`, cities: ['Main District', 'Central Metro'] },
    { name: `${country?.name || 'Northern'} Province`, iso2: `${code}2`, cities: ['Urban Center'] },
    { name: `${country?.name || 'Southern'} Province`, iso2: `${code}3`, cities: ['Metro Area'] }
  ];
}

export function getStaticCities(countryCode: string, stateIsoOrName: string): string[] {
  const states = getStaticStates(countryCode);
  const match = states.find(
    s => s.iso2.toLowerCase() === stateIsoOrName.toLowerCase() ||
         s.name.toLowerCase() === stateIsoOrName.toLowerCase()
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
