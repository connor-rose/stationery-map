import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import StationeryIcon from './assets/Default.png';

// You'll need to replace this with your Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

// iOS system colors
const lightColors = {
  background: '#F2F2F7', // iOS system background
  card: '#FFFFFF',
  text: '#000000',
  secondaryText: '#6C6C70',
  accent: '#007AFF', // iOS blue
  border: '#C6C6C8',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  secondaryText: '#8E8E93',
  accent: '#0A84FF',
  border: '#38383A',
  shadow: 'rgba(0, 0, 0, 0.3)'
};

// Example store data structure
interface StationeryStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  website?: string;
  state: string;
  country: string;
}

interface StateGroup {
  name: string;
  isExpanded: boolean;
  stores: StationeryStore[];
}

interface CountryGroup {
  name: string;
  isExpanded: boolean;
  states: { [key: string]: StateGroup };
}

// Sample store data
const stores: StationeryStore[] = [
  {
    id: '1',
    name: 'Paper Source',
    address: '123 Market St, San Francisco, CA 94105',
    latitude: 37.7879,
    longitude: -122.4075,
    website: 'https://www.papersource.com',
    state: 'California',
    country: 'United States'
  },
  {
    id: '109',
    name: 'Papier Plume',
    address: '842 Royal St, New Orleans, LA 70116',
    latitude: 29.95953,
    longitude: -90.06325,
    website: 'https://papierplume.com',
    state: 'Louisiana',
    country: 'United States'
  },
  {
    id: '110',
    name: 'Gus and Ruby Letterpress',
    address: '47 Exchange St, Portland, ME 04101',
    latitude: 43.6571,
    longitude: -70.2553,
    website: 'https://www.gusandruby.com',
    state: 'Maine',
    country: 'United States'
  },
  {
    id: '111',
    name: 'Saint-Gilles Stationery',
    address: 'Chau. de Charleroi 4, 1060 Saint-Gilles, Belgium',
    latitude: 50.8275,
    longitude: 4.3472,
    state: 'Brussels',
    country: 'Belgium'
  },
  {
    id: '112',
    name: 'Papeterie NIAS Bruxelles',
    address: 'Rue de la Régence 2, 1000 Bruxelles, Belgium',
    latitude: 50.8417,
    longitude: 4.3606,
    state: 'Brussels',
    country: 'Belgium'
  },
  {
    id: '113',
    name: 'Sakura Fountain Pen Gallery',
    address: 'Rue de la Régence 2, 1000 Bruxelles, Belgium',
    latitude: 50.8417,
    longitude: 4.3606,
    state: 'Brussels',
    country: 'Belgium'
  },
  {
    id: '114',
    name: 'Pen World',
    address: 'Paardenmarkt 116, 2000 Antwerpen, Belgium',
    latitude: 51.2214,
    longitude: 4.4057,
    state: 'Antwerp',
    country: 'Belgium'
  },
  {
    id: '115',
    name: 'Toronto Pen Shoppe',
    address: 'Toronto, ON, Canada',
    latitude: 43.64986,
    longitude: -79.35879,
    website: 'https://torontopenshoppe.com',
    state: 'Ontario',
    country: 'Canada'
  },
  {
    id: '116',
    name: 'Laywine\'s',
    address: '1200 Bay St, Toronto, ON M5R 2A5, Canada',
    latitude: 43.6702,
    longitude: -79.3897,
    state: 'Ontario',
    country: 'Canada'
  },
  {
    id: '117',
    name: 'Paper and Poste',
    address: '1112 Queen St E, Toronto, ON M4M 1K8, Canada',
    latitude: 43.6624,
    longitude: -79.3447,
    state: 'Ontario',
    country: 'Canada'
  },
  {
    id: '118',
    name: 'Blesket Canada',
    address: '284 Orenda Rd Unit 5, Brampton, ON L6T 5S3, Canada',
    latitude: 43.6855,
    longitude: -79.7592,
    state: 'Ontario',
    country: 'Canada'
  },
  {
    id: '119',
    name: 'Wonder Pens (Dundas)',
    address: '906 Dundas St W, Toronto, ON M6J 1V9, Canada',
    latitude: 43.6532,
    longitude: -79.4117,
    website: 'https://wonderpens.ca',
    state: 'Ontario',
    country: 'Canada'
  },
  {
    id: '120',
    name: 'Wonder Pens (Danforth)',
    address: '247 Danforth Ave, Toronto, ON M4K 1N2, Canada',
    latitude: 43.6765,
    longitude: -79.3528,
    website: 'https://wonderpens.ca',
    state: 'Ontario',
    country: 'Canada'
  },
  {
    id: '121',
    name: 'Papierhaus Hartmann',
    address: 'Hauptstraße 1, 10117 Berlin, Germany',
    latitude: 52.5200,
    longitude: 13.4050,
    website: 'https://www.papierhaus-hartmann.shop',
    state: 'Berlin',
    country: 'Germany'
  },
  {
    id: '122',
    name: 'Moranga',
    address: 'Oranienstraße 183, 10999 Berlin, Germany',
    latitude: 52.4977,
    longitude: 13.4228,
    website: 'https://www.moranga.de',
    state: 'Berlin',
    country: 'Germany'
  },
  {
    id: '123',
    name: 'Luiban',
    address: 'Grolmanstraße 54, 10623 Berlin, Germany',
    latitude: 52.5074,
    longitude: 13.3219,
    website: 'https://luiban.com',
    state: 'Berlin',
    country: 'Germany'
  },
  {
    id: '124',
    name: 'RSVP Berlin',
    address: 'Grolmanstraße 54, 10623 Berlin, Germany',
    latitude: 52.5074,
    longitude: 13.3219,
    website: 'https://rsvp-berlin.de',
    state: 'Berlin',
    country: 'Germany'
  },
  {
    id: '2',
    name: 'Maido Stationery',
    address: '1672 Post St, San Francisco, CA 94115',
    latitude: 37.7855,
    longitude: -122.4375,
    website: 'https://www.maidostationery.com',
    state: 'California',
    country: 'United States'
  },
  {
    id: '3',
    name: 'Bookmarked',
    address: '107 Kay Ave, Trustville, AL 35173',
    latitude: 33.618393931264,
    longitude: -86.614926344176,
    website: 'https://www.bookmarkedpaper.com/',
    state: 'Alabama',
    country: 'United States'
  },
  {
    id: '4',
    name: 'Kinkan Gifts',
    address: '2016 E Wildermuth Ave #1124, Tempe, AZ 85281',
    latitude: 33.413865362937,
    longitude: -111.899357960779,
    website: 'https://kinkangifts.com/',
    state: 'Arizona',
    country: 'United States'
  },
  {
    id: '5',
    name: 'Penchetta Pen & Knife',
    address: '5555 E. Bell Road, Suite 10, Scottsdale, AZ 85254',
    latitude: 33.6403,
    longitude: -111.9618,
    website: 'https://penchetta.com',
    state: 'Arizona',
    country: 'United States'
  },
  {
    id: '6',
    name: 'The Paper Place',
    address: '4130 N Marshall Way #C, Scottsdale, AZ 85251',
    latitude: 33.4942,
    longitude: -111.9290,
    website: 'https://thepaperplaceaz.com',
    state: 'Arizona',
    country: 'United States'
  },
  {
    id: '7',
    name: 'Design Lab by DDG',
    address: '66 West Main Street, #102, Mesa, AZ 85201',
    latitude: 33.4148,
    longitude: -111.8315,
    website: 'https://designlabyddg.co',
    state: 'Arizona',
    country: 'United States'
  },
  {
    id: '8',
    name: 'Sarnoff Artist Materials',
    address: '2504 N. Campbell Avenue, Tucson, AZ 85719',
    latitude: 32.2535,
    longitude: -110.9442,
    website: 'https://sarnoffart.com',
    state: 'Arizona',
    country: 'United States'
  },
  {
    id: '9',
    name: 'Chatterley Luxuries & Pen Haven LLC',
    address: '12090 North Thornydale Road, Marana, AZ 85658',
    latitude: 32.4190,
    longitude: -111.0420,
    website: 'https://chatterleyluxuries.com',
    state: 'Arizona',
    country: 'United States'
  },
  {
    id: '10',
    name: 'M.Lovewell',
    address: '115 N Orange St, Orange, CA 92866',
    latitude: 33.78818,
    longitude: -117.85185,
    website: 'https://mlovewell.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '11',
    name: 'M.Lovewell',
    address: '305 E 4th St #B, Santa Ana, CA 92701',
    latitude: 33.74825,
    longitude: -117.86514,
    website: 'https://mlovewell.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '12',
    name: 'Flax Pen to Paper',
    address: '1078 Gayley Avenue, Los Angeles, CA 90024',
    latitude: 34.060725596868,
    longitude: -118.446726289592,
    website: 'https://www.flaxpentopaper.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '13',
    name: 'Fog City Flea Trading Post',
    address: 'Ferry Building, San Francisco, CA',
    latitude: 37.7949491038594,
    longitude: -122.392696302952,
    website: 'http://www.shoptradingpost.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '14',
    name: 'Paper Moon Stationary',
    address: 'Turlock, CA',
    latitude: 37.4935145470654,
    longitude: -120.847155318305,
    website: 'https://www.papermoonsa.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '15',
    name: 'Orange Bird',
    address: '584 Hayes St, San Francisco, CA 94102',
    latitude: 37.7768406105715,
    longitude: -122.425656616447,
    website: 'https://www.shoporangebird.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '16',
    name: 'Payn\'s Stationery',
    address: '1791 Solano Ave, Berkeley CA 94707',
    latitude: 37.8913925628889,
    longitude: -122.280320984836,
    website: 'paynsstationery.com',
    state: 'California',
    country: 'United States'
  },
  {
    id: '17',
    name: 'post.script',
    address: '2413 California Street San Francisco, CA 94115',
    latitude: 37.7887317237607,
    longitude: -122.434194188718,
    website: 'https://postscriptshop.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '18',
    name: 'Be Nice Have Fun',
    address: '5011 York Blvd, Los Angeles, CA 90042',
    latitude: 34.1214764089238,
    longitude: -118.206413031919,
    website: 'https://linktr.ee/shopbenicehavefun',
    state: 'California',
    country: 'United States'
  },
  {
    id: '19',
    name: 'curious...',
    address: '128 Pier Ave, Hermosa Beach, CA 90254',
    latitude: 33.8622367462104,
    longitude: -118.399407480758,
    website: 'https://www.curiousworkshop.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '20',
    name: 'Shorthand',
    address: '5030 York Blvd, Los Angeles, CA 90042',
    latitude: 34.1211235904871,
    longitude: -118.205923400139,
    website: 'https://shopshorthand.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '21',
    name: 'Paper Plant Co',
    address: '936 N Hill St, Los Angeles, CA 90012',
    latitude: 34.0622225343,
    longitude: -118.238162031921,
    website: 'https://paperplant.co/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '22',
    name: 'Parchment Paper',
    address: '5054 Eagle Rock Blvd Unit 1/2, Los Angeles, CA 90041',
    latitude: 34.1384896528081,
    longitude: -118.214047060754,
    website: 'https://parchmentpaperla.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '23',
    name: 'Shout and About',
    address: '1547 Echo Park Ave, Los Angeles, CA 90026',
    latitude: 34.0811426287432,
    longitude: -118.254833645415,
    website: 'https://shoutandabout.co/pages/contact',
    state: 'California',
    country: 'United States'
  },
  {
    id: '24',
    name: 'The Social Type',
    address: '3197 Glendale Blvd, Los Angeles, CA 90039',
    latitude: 34.1179440264191,
    longitude: -118.261309518425,
    website: 'https://thesocialtype.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '25',
    name: 'Urbanic Paper Boutique',
    address: '11720 Washington Place Los Angeles, CA 90066',
    latitude: 34.0040857615374,
    longitude: -118.421469747264,
    website: 'https://urbanicpaper.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '26',
    name: 'Art Dept.',
    address: '5424D Pine Crest Ave, Idyllwild CA 92549',
    latitude: 33.7467444317059,
    longitude: -116.715896742538,
    website: 'https://www.shopartdept.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '27',
    name: 'bobo Palm Springs',
    address: '750 N Palm Canyon Dr, Palm Springs, CA 92262',
    latitude: 33.8325515398587,
    longitude: -116.546367571298,
    website: 'https://bobostudio.com/collections/bobo-palm-springs',
    state: 'California',
    country: 'United States'
  },
  {
    id: '28',
    name: 'Ink Paper Crafts',
    address: '3554 State Street Santa Barbara, CA 93105',
    latitude: 34.440576357403,
    longitude: -119.739774969077,
    website: 'https://inkpapercrafts.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '29',
    name: 'Crush & Touch Art Supply',
    address: '5080 1/2 York Blvd, Los Angeles, CA 90042',
    latitude: 34.1211519424178,
    longitude: -118.205861774249,
    website: 'http://www.crush-it.com/',
    state: 'California',
    country: 'United States'
  },
  {
    id: '30',
    name: 'Noted',
    address: '4040 Piedmont Ave, Oakland, CA 94611',
    latitude: 37.8289,
    longitude: -122.2494,
    website: 'https://notedboutique.com',
    state: 'California',
    country: 'United States'
  },
  {
    id: '31',
    name: 'Seaside Papery',
    address: '1162 Orange Ave, Coronado, CA 92118',
    latitude: 32.6828,
    longitude: -117.1796,
    website: 'https://seasidepapery.com',
    state: 'California',
    country: 'United States'
  },
  {
    id: '32',
    name: 'Sweet Paper',
    address: '7660-A Fay Ave, La Jolla, CA 92037',
    latitude: 32.8440,
    longitude: -117.2761,
    website: 'https://sweet-paper.com',
    state: 'California',
    country: 'United States'
  },
  {
    id: '33',
    name: 'Strenger Studio',
    address: '2707 Congress St, Ste 1E, San Diego, CA 92110',
    latitude: 32.7548,
    longitude: -117.1977,
    website: 'https://strengerstudio.com',
    state: 'California',
    country: 'United States'
  },
  {
    id: '34',
    name: 'Ladyfingers Letterpress',
    address: '113 East Bijou Street, Colorado Springs, CO 80903',
    latitude: 38.834,
    longitude: -104.821,
    website: 'https://ladyfingersletterpress.com',
    state: 'Colorado',
    country: 'United States'
  },
  {
    id: '35',
    name: 'Two Hands Paperie',
    address: '803 Pearl Street, Boulder, CO 80302',
    latitude: 40.017,
    longitude: -105.283,
    website: 'https://twohandspaperie.com',
    state: 'Colorado',
    country: 'United States'
  },
  {
    id: '36',
    name: 'Wolf & Wren Press',
    address: '218 6th Street, Crested Butte, CO 81224',
    latitude: 38.869,
    longitude: -106.987,
    website: 'https://wolfandwrenpress.com',
    state: 'Colorado',
    country: 'United States'
  },
  {
    id: '37',
    name: 'Write It Down',
    address: '358 Main Street, Grand Junction, CO 81501',
    latitude: 39.068,
    longitude: -108.567,
    website: 'https://writeitdowngj.com',
    state: 'Colorado',
    country: 'United States'
  },
  {
    id: '38',
    name: 'Hartford Prints!',
    address: '42 1/2 Pratt St., Hartford, CT 06103',
    latitude: 41.767,
    longitude: -72.675,
    website: 'https://hartfordprints.com',
    state: 'Connecticut',
    country: 'United States'
  },
  {
    id: '39',
    name: 'Slackline Press',
    address: '562 Main Street, Branford, CT 06405',
    latitude: 41.279,
    longitude: -72.815,
    website: 'https://slacklinepress.com',
    state: 'Connecticut',
    country: 'United States'
  },
  {
    id: '40',
    name: 'Hull\'s Art Supply + Framing',
    address: '1144 Chapel Street, New Haven, CT 06511',
    latitude: 41.3083,
    longitude: -72.9286,
    website: 'https://shophulls.com',
    state: 'Connecticut',
    country: 'United States'
  },
  {
    id: '41',
    name: 'De Gerenday\'s',
    address: '84 Lyme Street, Old Lyme, CT 06371',
    latitude: 41.3151,
    longitude: -72.3276,
    website: 'https://degerendays.com',
    state: 'Connecticut',
    country: 'United States'
  },
  {
    id: '42',
    name: 'Jerry\'s Artarama',
    address: '360 Main Avenue, Norwalk, CT 06851',
    latitude: 41.1486,
    longitude: -73.4179,
    website: 'https://jerrysretailstores.com',
    state: 'Connecticut',
    country: 'United States'
  },
  {
    id: '43',
    name: 'INK Fine Stationers',
    address: '109 Danbury Road, Ridgefield, CT 06877',
    latitude: 41.2886,
    longitude: -73.4973,
    website: 'https://inkofct.com',
    state: 'Connecticut',
    country: 'United States'
  },
  {
    id: '44',
    name: 'Fahrney\'s Pens',
    address: '1317 F St NW, Washington, DC 20004',
    latitude: 38.8977,
    longitude: -77.0300,
    website: 'https://fahrneyspens.com',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '45',
    name: 'Jenni Bick Custom Journals',
    address: '1300 Connecticut Ave NW #101, Washington, DC 20036',
    latitude: 38.9086,
    longitude: -77.0426,
    website: 'https://jennibick.com',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '46',
    name: 'Plaza Artist Materials',
    address: '1120 19th Street NW, Washington, DC 20036',
    latitude: 38.9047,
    longitude: -77.0431,
    website: 'https://plazaart.com',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '47',
    name: 'Chevy Chase Stationery',
    address: '3807 McKinley St NW, Washington, DC 20015',
    latitude: 38.9601,
    longitude: -77.0841,
    website: 'https://www.chevychasestationery.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '48',
    name: 'The Classic Desk',
    address: '1619 K St NW, Washington, DC 20006',
    latitude: 38.9006,
    longitude: -77.0379,
    website: 'https://www.theclassicdesk.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '49',
    name: 'Analog',
    address: '716 Monroe St NE, Studio 5, Washington, DC 20017',
    latitude: 38.9333,
    longitude: -77.0042,
    website: 'https://www.shopanalog.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '50',
    name: 'Copenhaver',
    address: '1621 Connecticut Ave NW, Washington, DC 20009',
    latitude: 38.9111,
    longitude: -77.0435,
    website: 'https://www.copenhaver.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '51',
    name: 'Pen & Prose',
    address: 'Washington National Airport N, Washington, DC 20001',
    latitude: 38.852,
    longitude: -77.0375,
    website: 'https://www.penandprose.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '52',
    name: 'A J Stationers of DC Inc',
    address: '625 Indiana Ave NW, Washington, DC 20004',
    latitude: 38.8951,
    longitude: -77.0225,
    website: 'https://www.ajstationers.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '53',
    name: 'Travel Traders Gift Shop',
    address: '1000 H St NW, Washington, DC 20001',
    latitude: 38.8977,
    longitude: -77.0365,
    website: 'https://www.traveltraders.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '54',
    name: 'Just Paper',
    address: '3232 P St NW, Washington, DC 20007',
    latitude: 38.9071,
    longitude: -77.0635,
    website: 'https://www.justpaper.com/',
    state: 'District of Columbia',
    country: 'United States'
  },
  {
    id: '55',
    name: 'Thinking Organized',
    address: '5425 Wisconsin Ave, Chevy Chase, MD 20815',
    latitude: 38.9806,
    longitude: -77.0841,
    website: 'https://www.thinkingorganized.com/',
    state: 'Maryland',
    country: 'United States'
  },
  {
    id: '56',
    name: 'Dexterous Organizing',
    address: '201 N Union St, Alexandria, VA 22314',
    latitude: 38.8048,
    longitude: -77.0469,
    website: 'https://www.dexterousorganizing.com/',
    state: 'Virginia',
    country: 'United States'
  },
  {
    id: '57',
    name: 'Quill and Press',
    address: '2721 East Ocean Blvd, Stuart, FL 34996',
    latitude: 27.1941,
    longitude: -80.2581,
    website: 'https://www.qandp.com/',
    state: 'Florida',
    country: 'United States'
  },
  {
    id: '58',
    name: 'America\'s Office Source',
    address: '706 Turnbull Avenue, Suite 305, Altamonte Springs, FL 32701',
    latitude: 28.6611,
    longitude: -81.3650,
    website: 'https://www.americasofficesource.com/',
    state: 'Florida',
    country: 'United States'
  },
  {
    id: '59',
    name: 'Montblanc',
    address: '6000 Glades Road Suite 1083, Boca Raton, FL 33431',
    latitude: 26.3583,
    longitude: -80.1833,
    website: 'https://www.yellowpages.com/boca-raton-fl/pen-store',
    state: 'Florida',
    country: 'United States'
  },
  {
    id: '60',
    name: 'Montblanc',
    address: '2223 N West Shore Blvd Ste 231, Tampa, FL 33607',
    latitude: 27.9575,
    longitude: -82.5350,
    website: 'https://www.yellowpages.com/tampa-fl/pen-stores',
    state: 'Florida',
    country: 'United States'
  },
  {
    id: '61',
    name: 'Wally\'s Printing',
    address: '969 N Farnsworth Ave, Aurora, IL 60505',
    latitude: 41.7731,
    longitude: -88.3075,
    website: 'https://www.wallysprinting.com/',
    state: 'Illinois',
    country: 'United States'
  },
  {
    id: '62',
    name: 'Atlas Stationers',
    address: '227 W Lake St, Chicago, IL 60606',
    latitude: 41.8842,
    longitude: -87.6324,
    website: 'https://www.atlasstationers.com/',
    state: 'Illinois',
    country: 'United States'
  },
  {
    id: '63',
    name: 'Fitzgerald\'s Fine Stationery',
    address: '111 North Marion Street, Oak Park, IL 60301',
    latitude: 41.8853,
    longitude: -87.7798,
    website: 'https://www.fitzgeraldsstationery.com/',
    state: 'Illinois',
    country: 'United States'
  },
  {
    id: '64',
    name: 'r.s.v.p.',
    address: '140 North Linn Street, Iowa City, IA 52245',
    latitude: 41.6611,
    longitude: -91.5302,
    website: 'https://www.responsehandwritingproject.com/aboutshop',
    state: 'Iowa',
    country: 'United States'
  },
  {
    id: '65',
    name: 'The Red Door Press',
    address: '900 Keosauqua Way, Des Moines, IA 50309',
    latitude: 41.5915,
    longitude: -93.6123,
    website: 'https://www.thereddoorpress.com/',
    state: 'Iowa',
    country: 'United States'
  },
  {
    id: '66',
    name: 'ephemera',
    address: '2000 8th St, West Des Moines, IA 50265',
    latitude: 41.5772,
    longitude: -93.7113,
    website: 'https://www.ephemeradesign.com/',
    state: 'Iowa',
    country: 'United States'
  },
  {
    id: '67',
    name: 'Depot Outlet',
    address: '510 Montgomery St, Decorah, IA 52101',
    latitude: 43.3033,
    longitude: -91.7875,
    website: 'https://www.mapquest.com/us/iowa/depot-outlet-350893610',
    state: 'Iowa',
    country: 'United States'
  },
  {
    id: '68',
    name: 'La Papeterie Design',
    address: 'Carmel, IN',
    latitude: 40.0282,
    longitude: -86.1180,
    website: 'https://www.lapapeteriedesign.com/',
    state: 'Indiana',
    country: 'United States'
  },
  {
    id: '69',
    name: 'Penpals Stationery Shoppe',
    address: '6219 N Flagler Rd, Evansville, IN 47715',
    latitude: 37.9810,
    longitude: -87.5290,
    website: 'https://www.penpalsstationshoppe.com/',
    state: 'Indiana',
    country: 'United States'
  },
  {
    id: '70',
    name: 'MEMO',
    address: '209 Main St, Evansville, IN 47708',
    latitude: 37.9714,
    longitude: -87.5712,
    website: 'https://www.memoevansville.com/',
    state: 'Indiana',
    country: 'United States'
  },
  {
    id: '71',
    name: 'Paper Herald',
    address: '702 Saint Paul Street, Baltimore, MD 21202',
    latitude: 39.2983,
    longitude: -76.6156,
    website: 'https://paperherald.com',
    state: 'Maryland',
    country: 'United States'
  },
  {
    id: '72',
    name: 'Bob Slate Stationery',
    address: '30 Brattle St, Cambridge, MA 02138',
    latitude: 42.37306,
    longitude: -71.12062,
    website: 'https://www.bobslatestationer.com',
    state: 'Massachusetts',
    country: 'United States'
  },
  {
    id: '73',
    name: 'The Paper Mouse',
    address: '1274 Washington St, West Newton, MA 02465',
    latitude: 42.34925,
    longitude: -71.22584,
    website: 'https://www.thepapermouse.com',
    state: 'Massachusetts',
    country: 'United States'
  },
  {
    id: '74',
    name: 'Boston General Store',
    address: '626 High St, Dedham, MA 02026',
    latitude: 42.24851,
    longitude: -71.17510,
    website: 'https://www.bostongeneralstore.com',
    state: 'Massachusetts',
    country: 'United States'
  },
  {
    id: '75',
    name: 'Boston General Store',
    address: '305 Harvard St, Brookline, MA 02446',
    latitude: 42.34322,
    longitude: -71.12262,
    website: 'https://www.bostongeneralstore.com',
    state: 'Massachusetts',
    country: 'United States'
  },
  {
    id: '76',
    name: 'Topdrawer',
    address: '275 Harvard St, Brookline, MA 02446',
    latitude: 42.34262,
    longitude: -71.12148,
    website: 'https://topdrawershop.com',
    state: 'Massachusetts',
    country: 'United States'
  },
  {
    id: '77',
    name: 'Topdrawer',
    address: '5 Brattle St, Cambridge, MA 02138',
    latitude: 42.37354,
    longitude: -71.11979,
    website: 'https://topdrawershop.com',
    state: 'Massachusetts',
    country: 'United States'
  },
  {
    id: '78',
    name: 'Topdrawer',
    address: '273 Newbury St, Boston, MA 02116',
    latitude: 42.34952,
    longitude: -71.08374,
    website: 'https://topdrawershop.com',
    state: 'Massachusetts',
    country: 'United States'
  },
  {
    id: '79',
    name: 'Oblation Paper & Press',
    address: 'Portland, OR',
    latitude: 45.52676260936835,
    longitude: -122.68313667342,
    website: 'https://www.oblationpapers.com/',
    state: 'Oregon',
    country: 'United States'
  },
  {
    id: '80',
    name: 'Main St Stamp and Stationery',
    address: '12345 SW Main St, Tigard, OR 97223',
    latitude: 45.43162,
    longitude: -122.77009,
    website: 'https://www.mainstreetstationary.com',
    state: 'Oregon',
    country: 'United States'
  },
  {
    id: '81',
    name: 'Ecru modern stationer',
    address: '1215 NW 11th Ave, Portland, OR 97209',
    latitude: 45.53174,
    longitude: -122.68255,
    website: 'https://ecrupaper.com/',
    state: 'Oregon',
    country: 'United States'
  },
  {
    id: '82',
    name: 'Handprints Stationery and Gifts',
    address: '620 SW 6th St, Grants Pass, Oregon 97526',
    latitude: 42.43581,
    longitude: -123.32933,
    website: 'https://www.instagram.com/handprintsgp/',
    state: 'Oregon',
    country: 'United States'
  },
  {
    id: '83',
    name: 'Oregon Stationers',
    address: '217 NE 3rd Street McMinnville, OR 97128',
    latitude: 45.21024,
    longitude: -123.19751,
    website: 'https://www.oregonstationers.biz/',
    state: 'Oregon',
    country: 'United States'
  },
  {
    id: '84',
    name: 'Rock Paper Scissor',
    address: '3908 N. Mississippi Avenue, Portland, Oregon 97227',
    latitude: 45.55103,
    longitude: -122.67535,
    website: 'https://www.rockpaperscissor.shop/',
    state: 'Oregon',
    country: 'United States'
  },
  {
    id: '85',
    name: 'Paper Epiphanies',
    address: '2501 SE Clinton St Portland OR 97202',
    latitude: 45.50352,
    longitude: -122.64017,
    website: 'https://paperepiphanies.com/pages/visit',
    state: 'Oregon',
    country: 'United States'
  },
  {
    id: '86',
    name: 'Flywheel',
    address: 'New Norfolk, Tasmania, Australia',
    latitude: -42.7804,
    longitude: 147.06372,
    website: 'https://www.flywheel.net.au/',
    state: 'Tasmania',
    country: 'Australia'
  },
  {
    id: '87',
    name: 'Pointe Plume',
    address: '21 Rue Quentin Bauchart, 75008 Paris, France',
    latitude: 48.87047,
    longitude: 2.30162,
    website: 'https://www.pointeplume.com',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '88',
    name: 'Plume et Bille',
    address: 'Paris, France',
    latitude: 48.87314,
    longitude: 2.32432,
    website: 'https://plumeetbille.com/',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '89',
    name: 'L\'Ecritoire Paris',
    address: '26 Passage Molière, 75003 Paris, France',
    latitude: 48.86226516646548,
    longitude: 2.3518791566909055,
    website: 'https://lecritoireparis.com/en/',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '90',
    name: 'Atelier Leseon Montres Et Stylos',
    address: 'ATELIER DE STAGE sur rendez vous, 6 Rue du Trésorier, 92500 Asnières-sur-Seine, France',
    latitude: 48.9064943,
    longitude: 2.2875978,
    website: 'atelier-leseon.com',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '91',
    name: 'Melodies Graphiques',
    address: '10 Rue du Pont Louis-philippe, 75004 Paris, France',
    latitude: 48.85496,
    longitude: 2.35569,
    website: 'https://melodies-graphiques.com/',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '92',
    name: 'Lavrut',
    address: '52 Passage Choiseul, 75002 Paris, France',
    latitude: 48.86811,
    longitude: 2.33561,
    website: 'https://www.lavrut.com/',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '93',
    name: 'Grimart - NOQO - SHADY',
    address: 'Paris, France',
    latitude: 48.85457,
    longitude: 2.30633,
    website: 'http://www.parispapeterie.fr',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '94',
    name: 'Papeterie de l\'Ecole Militaire',
    address: '41 Av. de la Motte-Picquet, 75007 Paris, France',
    latitude: 48.85457,
    longitude: 2.30633,
    website: 'http://www.parispapeterie.fr',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '95',
    name: 'Marché Vernaison',
    address: '93400 Saint-Ouen-sur-Seine, France',
    latitude: 48.9026340,
    longitude: 2.3433239,
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '96',
    name: 'Montblanc',
    address: '152 Av. des Champs-Élysées, 75008 Paris, France',
    latitude: 48.873242023035025,
    longitude: 2.2979612935069,
    website: 'https://www.montblanc.fr',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '97',
    name: 'Boisnard',
    address: 'Paris, France',
    latitude: 48.8725331,
    longitude: 2.3102959,
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '98',
    name: 'Palais du Stylos',
    address: '9 Rue Auber, 75009 Paris, France',
    latitude: 48.8723576,
    longitude: 2.3291683,
    website: 'stylos-prestige.fr',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '99',
    name: 'Delfonics Paris Louvre',
    address: '99 Rue de Rivoli, 75001 Paris, France',
    latitude: 48.8611021,
    longitude: 2.3354799,
    website: 'delfonics.fr',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '100',
    name: 'Papeterie Saint Sabin',
    address: '16 Rue St Sabin, 75011 Paris, France',
    latitude: 48.8555722,
    longitude: 2.3718764,
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '101',
    name: 'Papeterie de l\'Ecole Montparnasse',
    address: '41 Rue du Montparnasse, 75014 Paris, France',
    latitude: 48.8420385,
    longitude: 2.3289825,
    website: 'papeteriemontparnasse.fr',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '102',
    name: 'Sennelier Shop',
    address: '6 Rue Halle, 75014 Paris, France',
    latitude: 48.830784928633,
    longitude: 2.333332420400361,
    website: 'magasinsennelier.art',
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '103',
    name: 'Papeterie Makkura',
    address: 'Online only',
    latitude: 48.8611021,
    longitude: 2.3354799,
    state: 'Île-de-France',
    country: 'France'
  },
  {
    id: '104',
    name: 'Link',
    address: '23 Rue Charles Sanglier, 45000 Orleans, France',
    latitude: 47.9013036,
    longitude: 1.9044857,
    website: 'boutiquelink.fr',
    state: 'Centre-Val de Loire',
    country: 'France'
  },
  {
    id: '105',
    name: 'Montblanc Stylos Poitiers',
    address: '37 Rue Gambetta, 86000 Poitiers, France',
    latitude: 46.5817551,
    longitude: 0.3404608,
    website: 'syll.fr',
    state: 'Nouvelle-Aquitaine',
    country: 'France'
  },
  {
    id: '106',
    name: 'Papeterie Bahon-Rault',
    address: '18 Rue du Champ Jacquet, 35000 Rennes, France',
    latitude: 48.1134623,
    longitude: -1.6798538,
    website: 'papeteriebahonrault.fr',
    state: 'Bretagne',
    country: 'France'
  },
  {
    id: '107',
    name: 'La Maison du Stylo',
    address: '62 Rue de Siam, 29200 Brest, France',
    latitude: 48.3880134,
    longitude: -4.4894332,
    website: 'librairedialogues.fr',
    state: 'Bretagne',
    country: 'France'
  },
  {
    id: '108',
    name: 'Lighthouse Paper Co.',
    address: '3600 N Wickham Rd Suite 105, Melbourne, FL 32935',
    latitude: 28.1636979165901,
    longitude: -80.6725446644178,
    website: 'http://www.lighthousepaper.com/',
    state: 'Florida',
    country: 'United States'
  },
  {
    id: '131',
    name: 'Japan Stationery',
    address: '1-2-1 Nihonbashi, Chuo-ku, Tokyo 103-0027, Japan',
    latitude: 35.6804,
    longitude: 139.7671,
    website: 'https://www.japan-stationery.com/',
    state: 'Tokyo',
    country: 'Japan'
  },
  {
    id: '132',
    name: 'GINZA TSUTAYA BOOKS',
    address: '6 Chome-10-1 Ginza, Chuo City, Tokyo 104-0061, Japan (ＳＩＸ６階)',
    latitude: 35.6696,
    longitude: 139.7645,
    website: 'https://store.tsite.jp/ginza/',
    state: 'Tokyo',
    country: 'Japan'
  },
  {
    id: '133',
    name: 'Stickerrific',
    address: '19-1, Jalan 17/45, Seksyen 17, 46400 Petaling Jaya, Selangor, Malaysia',
    latitude: 3.1206,
    longitude: 101.6342,
    website: 'https://stickerrificstore.com/',
    state: 'Selangor',
    country: 'Malaysia'
  },
  {
    id: '134',
    name: 'KSGills Pen Gifts',
    address: '79 Jalan Sultan, 50000 Kuala Lumpur, Malaysia',
    latitude: 3.1446,
    longitude: 101.6975,
    website: 'https://www.ksgills.com/',
    state: 'Kuala Lumpur',
    country: 'Malaysia'
  },
  {
    id: '135',
    name: 'Faber-Castell',
    address: 'Menara UAC, Jalan PJU 7/5, Mutiara Damansara, 47800 Petaling Jaya, Selangor, Malaysia',
    latitude: 3.1542,
    longitude: 101.6090,
    website: 'https://www.faber-castell.com.my/',
    state: 'Selangor',
    country: 'Malaysia'
  },
  {
    id: '136',
    name: 'Lamy Pen Shop',
    address: 'Lot 10 Shopping Centre, 50, Jalan Sultan Ismail, Bukit Bintang, 50250 Kuala Lumpur, Malaysia',
    latitude: 3.1466,
    longitude: 101.7122,
    website: 'https://www.lamy.com.my/',
    state: 'Kuala Lumpur',
    country: 'Malaysia'
  },
  {
    id: '137',
    name: 'PenGallery',
    address: '19-3, Jalan 17/45, Seksyen 17, 46400 Petaling Jaya, Selangor, Malaysia',
    latitude: 3.1206,
    longitude: 101.6342,
    website: 'https://www.pengallery.com/',
    state: 'Selangor',
    country: 'Malaysia'
  },
  {
    id: '138',
    name: 'Present and Correct',
    address: '12 Bury Pl, London, WC1A 2JL, England',
    latitude: 51.51848,
    longitude: -0.12416,
    website: 'https://www.presentandcorrect.com/',
    state: 'England',
    country: 'United Kingdom'
  },
  {
    id: '139',
    name: 'Choosing Keeping',
    address: '21 Tower St, London, WC2H 9NS, England',
    latitude: 51.51312,
    longitude: -0.12745,
    website: 'https://choosingkeeping.com/',
    state: 'England',
    country: 'United Kingdom'
  },
  {
    id: '140',
    name: 'Warren & Son',
    address: '85 High Street, Winchester, SO23 9AE, England',
    latitude: 51.06327,
    longitude: -1.31742,
    website: 'https://www.warrenandson.com/about-us/',
    state: 'England',
    country: 'United Kingdom'
  },
  {
    id: '141',
    name: 'London Graphic Centre',
    address: '16-18 Shelton St, Covent Garden, WC2H 9JL, England',
    latitude: 51.5133,
    longitude: -0.12602,
    website: 'https://www.londongraphics.co.uk/',
    state: 'England',
    country: 'United Kingdom'
  }
];

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [lng] = useState(-122.4194);
  const [lat] = useState(37.7749);
  const [zoom] = useState(12);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [expandedCountries, setExpandedCountries] = useState<{ [key: string]: boolean }>(() => {
    const groups: { [key: string]: CountryGroup } = {};
    stores.forEach(store => {
      const country = store.country || 'United States';
      if (!groups[country]) {
        groups[country] = {
          name: country,
          isExpanded: false,
          states: {}
        };
      }
    });
    const firstCountry = Object.keys(groups)[0];
    return firstCountry ? { [firstCountry]: true } : {};
  });
  const [expandedStates, setExpandedStates] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  });
  const [isListOpen, setIsListOpen] = useState(false);

  // Update colors based on mode
  const colors = isDarkMode ? darkColors : lightColors;

  // Group stores by country and state
  const groupedStores = useMemo<{ [key: string]: CountryGroup }>(() => {
    const groups: { [key: string]: CountryGroup } = {};
    
    // First sort all stores by name
    const sortedStores = [...stores].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedStores.forEach(store => {
      const country = store.country || 'United States';
      const state = store.state || 'Unknown';
      
      if (!groups[country]) {
        groups[country] = {
          name: country,
          isExpanded: expandedCountries[country] || false,
          states: {}
        };
      }
      
      if (!groups[country].states[state]) {
        groups[country].states[state] = {
          name: state,
          isExpanded: expandedStates[state] || false,
          stores: []
        };
      }
      
      groups[country].states[state].stores.push(store);
    });
    
    // Sort countries alphabetically
    const sortedGroups: { [key: string]: CountryGroup } = {};
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .forEach(country => {
        // Sort states within each country
        const sortedStates: { [key: string]: StateGroup } = {};
        Object.keys(groups[country].states)
          .sort((a, b) => a.localeCompare(b))
          .forEach(state => {
            // States are already sorted by store name from the initial sort
            sortedStates[state] = groups[country].states[state];
          });
        
        sortedGroups[country] = {
          ...groups[country],
          states: sortedStates
        };
      });
    
    return sortedGroups;
  }, [stores, expandedCountries, expandedStates]);

  // Filter stores based on search query with proper typing
  const filteredGroups = useMemo<{ [key: string]: CountryGroup }>(() => {
    if (!searchQuery) return groupedStores;
    
    const filtered: { [key: string]: CountryGroup } = {};
    
    Object.entries(groupedStores).forEach(([countryName, country]) => {
      const filteredStates: { [key: string]: StateGroup } = {};
      
      Object.entries(country.states).forEach(([stateName, state]) => {
        const filteredStores = state.stores.filter(store => 
          store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (filteredStores.length > 0) {
          filteredStates[stateName] = {
            ...state,
            stores: filteredStores.sort((a, b) => a.name.localeCompare(b.name))
          };
        }
      });
      
      if (Object.keys(filteredStates).length > 0) {
        filtered[countryName] = {
          ...country,
          states: filteredStates
        };
      }
    });
    
    return filtered;
  }, [groupedStores, searchQuery]);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      try {
        console.log('Initializing map with token:', MAPBOX_TOKEN);
        
        // Ensure the map container has dimensions
        const container = mapContainer.current;
        if (container.offsetHeight === 0) {
          container.style.height = '100%';
          container.style.width = '100%';
        }
        
        // Initialize the map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: zoom,
          attributionControl: true
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Handle map load
        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setMapError(null);
          
          // Clear existing markers
          markers.current.forEach(marker => marker.remove());
          markers.current = [];

          // Add markers for each store
          stores.forEach(store => {
            const popup = new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 12px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #000000;">${store.name}</h3>
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #000000;">${store.address}</p>
                  ${store.website ? `
                    <a href="${store.website}" 
                       target="_blank" 
                       style="
                         color: #FFFFFF;
                         text-decoration: none;
                         font-size: 14px;
                         display: inline-block;
                         background-color: #007AFF;
                         padding: 8px 12px;
                         border-radius: 6px;
                       "
                    >Visit Website</a>
                  ` : ''}
                </div>
              `);

            const marker = new mapboxgl.Marker({
              color: '#FF9500'
            })
              .setLngLat([store.longitude, store.latitude])
              .setPopup(popup)
              .addTo(map.current!);

            markers.current.push(marker);
          });
        });

        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Error loading map. Please try refreshing the page.');
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please check your connection and try again.');
      }
    }

    // Update map style when dark mode changes
    if (map.current) {
      map.current.setStyle('mapbox://styles/mapbox/streets-v12');
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lng, lat, zoom, isDarkMode]);

  const handleStoreClick = (store: StationeryStore) => {
    if (map.current) {
      map.current.flyTo({
        center: [store.longitude, store.latitude],
        zoom: 15,
        duration: 1000
      });

      const marker = markers.current.find(m => 
        m.getLngLat().lng === store.longitude && 
        m.getLngLat().lat === store.latitude
      );
      if (marker) {
        marker.togglePopup();
      }

      setSelectedStore(store.id);
      if (isMobile) {
        setIsListOpen(false);
      }
    }
  };

  const handleCountryClick = (countryName: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [countryName]: !prev[countryName]
    }));
  };

  const handleStateClick = (stateName: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [stateName]: !prev[stateName]
    }));
  };

  // Force focus on mobile when list is open
  useEffect(() => {
    if (isMobile && isListOpen && !isInputFocused) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setIsInputFocused(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isListOpen, isInputFocused]);

  // Handle focus management
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.background,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: colors.text,
      transition: 'background-color 0.3s ease'
    }}>
      <header style={{ 
        padding: '1rem',
        backgroundColor: colors.card,
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <div style={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          padding: '0 1rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <img
              src={StationeryIcon}
              alt="Stationery Icon"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                marginRight: 16,
                background: 'white',
                boxShadow: `0 2px 8px ${colors.shadow}`
              }}
            />
            <div>
              <h1 style={{ 
                fontSize: '24px',
                fontWeight: '700',
                color: colors.text,
                margin: 0,
                textAlign: 'left',
                whiteSpace: 'nowrap'
              }}>Stationery Store Map</h1>
              <p style={{
                fontSize: '15px',
                color: colors.secondaryText,
                margin: '4px 0 0 0',
                textAlign: 'left'
              }}>
                Powered by{' '}
                <a 
                  href="https://www.penedex.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    color: '#FF9500',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Penedex
                </a>
              </p>
            </div>
          </div>
          <div style={{
            width: isMobile ? '100%' : '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            gap: '12px',
            position: 'relative',
            marginLeft: isMobile ? '0' : 'auto',
            marginRight: isMobile ? '0' : 'auto'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              flex: 1,
              justifyContent: isMobile ? 'center' : 'flex-end'
            }}>
              {isMobile && (
                <button
                  onClick={() => setIsListOpen(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.text,
                    fontSize: '15px',
                    fontWeight: '500',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  Show List
                </button>
              )}
              <button
                onClick={() => window.location.href = 'mailto:hello@penedex.com?subject=New Stationery Store Submission'}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: '15px',
                  fontWeight: '500',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flex: isMobile ? 1 : 'none',
                  textAlign: 'center'
                }}
              >
                Submit Store Info
              </button>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.text,
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                padding: 0,
                marginLeft: '24px'
              }}
            >
              {isDarkMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main style={{ 
        flex: 1,
        padding: isMobile ? '0' : '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        gap: '1rem',
        height: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 80px)',
        position: 'relative'
      }}>
        {/* Map always visible on mobile; list is overlay. On desktop, both visible. */}
        <div style={{
          flex: 1.5,
          position: 'relative',
          backgroundColor: colors.card,
          borderRadius: isMobile ? '0' : '10px',
          boxShadow: isMobile ? 'none' : `0 2px 8px ${colors.shadow}`,
          overflow: 'hidden',
          height: '100%',
          width: '100%',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
        }}>
          {mapError ? (
            <div style={{ 
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              color: '#FF3B30',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '15px'
            }}>
              <strong>Error: </strong>
              <span>{mapError}</span>
            </div>
          ) : (
            <div 
              ref={mapContainer} 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                minHeight: '300px'
              }} 
            />
          )}
        </div>

        {/* Mobile List Overlay */}
        {isMobile && isListOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '17px',
                fontWeight: '600',
                margin: 0,
                color: colors.text
              }}>Stores</h2>
              <button
                onClick={() => setIsListOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.text,
                  padding: '8px',
                  cursor: 'pointer'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    paddingLeft: '32px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    color: colors.text,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.secondaryText}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                >
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem',
              backgroundColor: colors.background
            }}>
              {Object.entries(filteredGroups).map(([countryName, country]) => (
                <div key={countryName} style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => handleCountryClick(countryName)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: colors.text,
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      margin: 0,
                      color: colors.text,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {countryName}
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: colors.secondaryText,
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '12px'
                      }}>
                        {Object.values(country.states).reduce((acc, state) => acc + state.stores.length, 0)}
                      </span>
                    </h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.text}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: expandedCountries[countryName] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {expandedCountries[countryName] && Object.entries(country.states).map(([stateName, state]) => (
                    <div key={stateName} style={{ marginLeft: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleStateClick(stateName)}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          color: colors.text,
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: '500',
                          margin: 0,
                          color: colors.text,
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {stateName}
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: colors.secondaryText,
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            padding: '1px 5px',
                            borderRadius: '10px'
                          }}>
                            {state.stores.length}
                          </span>
                        </h4>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={colors.text}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: expandedStates[stateName] ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      {expandedStates[stateName] && (
                        <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                          {state.stores.map(store => (
                            <button
                              key={store.id}
                              onClick={() => handleStoreClick(store)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '8px',
                                backgroundColor: selectedStore === store.id ? '#FF9500' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                color: selectedStore === store.id ? '#FFFFFF' : colors.text
                              }}
                            >
                              <div style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                marginBottom: '4px'
                              }}>
                                {store.name}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: selectedStore === store.id ? 'rgba(255, 255, 255, 0.8)' : colors.secondaryText
                              }}>
                                {store.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desktop: list always visible. Mobile: list is overlay. */}
        {!isMobile && (
          <div style={{
            width: '280px',
            backgroundColor: colors.card,
            borderRadius: '10px',
            boxShadow: `0 2px 8px ${colors.shadow}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            height: '100%'
          }}>
            {/* --- List UI from above --- */}
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              flexShrink: 0
            }}>
              <h2 style={{
                fontSize: '17px',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: colors.text
              }}>Stores</h2>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    paddingLeft: '32px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    color: colors.text,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.secondaryText}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                >
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem',
              minHeight: 0
            }}>
              {Object.entries(filteredGroups).map(([countryName, country]) => (
                <div key={countryName} style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => handleCountryClick(countryName)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: colors.text,
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      margin: 0,
                      color: colors.text,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {countryName}
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: colors.secondaryText,
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '12px'
                      }}>
                        {Object.values(country.states).reduce((acc, state) => acc + state.stores.length, 0)}
                      </span>
                    </h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.text}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: expandedCountries[countryName] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {expandedCountries[countryName] && Object.entries(country.states).map(([stateName, state]) => (
                    <div key={stateName} style={{ marginLeft: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleStateClick(stateName)}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          color: colors.text,
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: '500',
                          margin: 0,
                          color: colors.text,
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {stateName}
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: colors.secondaryText,
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            padding: '1px 5px',
                            borderRadius: '10px'
                          }}>
                            {state.stores.length}
                          </span>
                        </h4>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={colors.text}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: expandedStates[stateName] ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      {expandedStates[stateName] && (
                        <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                          {state.stores.map(store => (
                            <button
                              key={store.id}
                              onClick={() => handleStoreClick(store)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '8px',
                                backgroundColor: selectedStore === store.id ? '#FF9500' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                color: selectedStore === store.id ? '#FFFFFF' : colors.text
                              }}
                            >
                              <div style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                marginBottom: '4px'
                              }}>
                                {store.name}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: selectedStore === store.id ? 'rgba(255, 255, 255, 0.8)' : colors.secondaryText
                              }}>
                                {store.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
