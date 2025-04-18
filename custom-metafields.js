const axios = require('axios');
const klaviyo = require('klaviyo');

const SHOP_HANDLE = "your-shop-handle-here";
const METAFIELDS = []; // Add metafield keys to sync to the array, leave blank to sync all metafields
const NAMESPACE = "custom"; // Make sure this matches the namespace in your Shopify instance
const NUM_FIELDS_RESPONSE = 10; // Max number of metafields to return

export default async (event, profile, context) => {
    
  const eventProperties = event.data.attributes.event_properties;
  const profileId = profile.data.id;
  const shopifyAccessToken = process.env.shopify_access_token;
  const shopifyId = eventProperties.$extra.customer.id;
  const shopUrl = `https://${SHOP_HANDLE}.myshopify.com/admin/api/2024-10/graphql.json`;

  try {
    const metafieldsResponse = await getMetafields(shopUrl, shopifyId, shopifyAccessToken);
    console.log(metafieldsResponse)
    const nonNullMetafields = metafieldsResponse.filter(mf => mf.value !== null);

    if (nonNullMetafields.length > 0) {
      await addMetafieldsToProfile(nonNullMetafields, profileId);
      console.log(`Profile updated with following metafield info:`, nonNullMetafields);
    } else {
      console.log("No metafields to sync");
    }
  } catch (error) {
    console.error("Error syncing metafields:", error);
  }
}

async function getMetafields(shopUrl, shopifyId, shopifyAccessToken) {
  let fieldsQuery = "";
  if (METAFIELDS.length > 0) {
    const formattedFields = METAFIELDS.map(f => `${NAMESPACE}.${f.replace(/ /g, "_")}`);
    const fieldsString = JSON.stringify(formattedFields);
    fieldsQuery = `keys: ${fieldsString},`;
  }

  const query = `
    query {
      customer(id: "gid://shopify/Customer/${shopifyId}") {
        metafields(${fieldsQuery}first: ${NUM_FIELDS_RESPONSE}) {
          nodes {
            key
            value
            jsonValue
          }
        }
      }
    }
  `;

  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': shopifyAccessToken,
  };

  const payload = {
    query,
  };

  const response = await axios.post(shopUrl, payload, { headers });
  return response.data.data.customer.metafields.nodes;
}

async function addMetafieldsToProfile(metafields, profileId) {
  const attributes = {
    properties: {},
  };

  metafields.forEach(field => {
    const key = String(field.key);
    const value = field.jsonValue;
    attributes.properties[key] = value;
  });

  const requestBody = {
    data: {
      type: "profile",
      id: profileId,
      attributes,
    },
  };

  await klaviyo.Profiles.updateProfile(profileId, requestBody); // Replace with correct SDK function if different
}
