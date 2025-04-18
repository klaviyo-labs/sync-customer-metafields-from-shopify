# How to sync customer metafields from Shopify in a custom action

## Background

Today, we are unable to sync customer metafields from Shopify via our standard integration. These fields can be valuable since they store information in a key/value pair, making them more versatile and useful than Shopify tags (which we do sync by default). 

One tricky piece with syncing metafields is that one method of syncing information, Shopify Flows, does not give access to customer metafields, so we can’t use them to sync metafields to Klaviyo. Another tricky piece is that Klaviyo can’t listen to fields being updated in Shopify, so we can’t sync metafields in real time as their updated. As a result, this solution relies on a Placed Order metric, since these will often result in updated metafields, but it can be configured to trigger on other events. 

> ⚠️
> 
> This solution relies on Custom Actions, which are gated to customers with 400k active profiles or more.

## Solution

Shopify’s GraphQL APIs allow access to [customer metafields](https://shopify.dev/docs/api/admin-graphql/unstable/queries/customer), so we can create a custom action in Klaviyo that pulls info from Shopify, then sets it to the profile in Klaviyo. The code syncs any non-None metafields for a profile.

The metafields will be added to the profile in the same format as they are stored in Shopify: The profile property key is the metafield key, and the value is the metafield value.

### Setup instructions

First, create a new Klaviyo flow, and make the trigger something like Placed Order. This is up to the customer, I’d recommend using a metric that coincides with metafields being created/updated, and note that the more frequent the metric, the more likely it is you’ll run into rate limits
Next, add a short time delay (5 minutes) to ensure any metafield updates are complete prior to getting the from Shopify
Then, add a [Custom Action](https://developers.klaviyo.com/en/docs/add_a_custom_action_to_a_flow) to your flow, choose you preferred language, and create it. You can then copy the relevant version from below into the code editor.
Once the action is created and code copied, make sure to import the ‘request’ or ‘axios’ module (python or JS) and allow the Klaviyo app to use oAuth for the profile updates if you haven’t done so prior.
Next, you will need the following pieces to setup this function and run it in Klaviyo:
- Shopify Access Token: This will be added as an environment variable named “shopify_access_token”
  - Instructions to generate this code are [here](https://help.shopify.com/en/manual/apps/app-types/custom-apps#enable-custom-app-development)
- Shopify Store Handle
  - If you go to your store admin, it’s the string after “shop” in the URL
- List of metafields
  - If you only want to sync specific metafields, add them to the list METAFIELDS
  - Otherwise, leave it blank and the code will sync all metafields, up to the number in NUM_FIELDS_RESPONSE
- Namespace
  - This will likely be “custom”, but look at a metafield in your store and look at the “namespace and key” field. The value before the period is the namespace.

Once all this info is set, feel free to test the function on an event. Make sure the test event is a profile with metafields set in Shopify. The function will give an output of whether or not their were metafields to sync, and what fields and values were synced if they did exist. 
