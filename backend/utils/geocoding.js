const axios = require('axios');

// Cache pentru a reduce numărul de apeluri API
const districtCache = new Map();

// Lista cartierelor din Timișoara pentru matching
const timisoaraDistricts = [
    'Aradului', 'Blașcovici', 'Braytim', 'Cetate', 'Ciarda Roșie', 
    'Circumvalațiunii', 'Complexul Studențesc', 'Dâmbovița', 'Elisabetin',
    'Fabric', 'Fratelia', 'Freidorf', 'Ghiroda Nouă', 'Girocului',
    'Iosefin', 'Kuncz', 'Lipovei', 'Martirilor', 'Medicinei', 'Mehala',
    'Modern', 'Odobescu', 'Olimpia–Stadion', 'Plăvăț', 'Plopi',
    'Ronaț', 'Sever Bocu', 'Soarelui', 'Steaua', 'Șagului', 'Tipografilor',
    'Torontalului', 'UMT–Pădurea Verde'
];

/**
 * Get district from coordinates using Mapbox Reverse Geocoding API
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string|null>} District name or null if not found
 */
async function getDistrictFromCoordinates(latitude, longitude) {
    // Check cache first
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (districtCache.has(cacheKey)) {
        return districtCache.get(cacheKey);
    }

    try {
        const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
            console.error('Mapbox access token not found in environment variables');
            return null;
        }

        // Mapbox Reverse Geocoding API
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&types=neighborhood,locality&language=ro`;
        
        const response = await axios.get(url);
        
        if (response.data && response.data.features && response.data.features.length > 0) {
            console.log(`\n=== Mapbox response for ${latitude}, ${longitude} ===`);
            console.log('Features:', JSON.stringify(response.data.features.map(f => ({
                text: f.text,
                place_name: f.place_name,
                place_type: f.place_type
            })), null, 2));
            
            // Look through all features to find a matching district
            for (const feature of response.data.features) {
                const placeName = feature.place_name || feature.text || '';
                
                // Check if any district name is in the place name
                for (const district of timisoaraDistricts) {
                    if (placeName.includes(district)) {
                        console.log(`✓ Found district "${district}" in place_name: ${placeName}`);
                        districtCache.set(cacheKey, district);
                        return district;
                    }
                }
                
                // Also check the text field
                const text = feature.text || '';
                for (const district of timisoaraDistricts) {
                    if (text.includes(district)) {
                        console.log(`✓ Found district "${district}" in text: ${text}`);
                        districtCache.set(cacheKey, district);
                        return district;
                    }
                }
            }
            console.log('✗ No matching district found');
        }
        
        // Cache null result to avoid repeated failed lookups
        districtCache.set(cacheKey, null);
        return null;
    } catch (error) {
        console.error('Error in Mapbox reverse geocoding:', error.message);
        return null;
    }
}

/**
 * Extract district name from address string
 * @param {string} address 
 * @returns {string|null}
 */
function getDistrictFromAddress(address) {
    if (!address) return null;
    
    for (const district of timisoaraDistricts) {
        if (address.includes(district)) {
            return district;
        }
    }
    
    return null;
}

/**
 * Get district with fallback: try coordinates first, then address
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} address 
 * @returns {Promise<string|null>}
 */
async function getDistrict(latitude, longitude, address) {
    // Try coordinates first
    let district = await getDistrictFromCoordinates(latitude, longitude);
    
    // Fallback to address matching
    if (!district) {
        district = getDistrictFromAddress(address);
    }
    
    return district;
}

module.exports = {
    getDistrictFromCoordinates,
    getDistrictFromAddress,
    getDistrict
};
