import requests
import klaviyo

SHOP_HANDLE = "your-shop-handle-here"
METAFIELDS = [] #add metafield keys to sync to the array, leave blank to sync all metafields
NAMESPACE = "custom" #make sure this matches the namespace in your Shopify instance
NUM_FIELDS_RESPONSE = 10 #max number of metafields to return

def handler(event, profile, context):
    event_properties = event["data"]["attributes"]["event_properties"]
    profile_id = profile["data"]["id"]
    shopify_access_token = os.getenv("shopify_access_token")
    shopify_id = event_properties['$extra']['customer']['id']
    shop_url = f"https://{SHOP_HANDLE}.myshopify.com/admin/api/2024-10/graphql.json"
    
    metafields_response = get_metafields(shop_url,shopify_id,shopify_access_token)
    non_None_metafields = list(filter(lambda x: x['value'] is not None,metafields_response))

    if len(non_None_metafields):
        add_metafields_to_profile(non_None_metafields, profile_id)
    else:
        print("No metafields to sync")
        return
    print(f"Profile updated with following metafield info: {non_None_metafields}")

def get_metafields(shop_url,shopify_id, shopify_access_token):
    fields_query = ""
    if(len(METAFIELDS)): #formats keys with namespace for API if METAFIELDS contains keys, otherwise gets all metafields
        fields = [f"{NAMESPACE}.{field.replace(' ','_')}" for field in METAFIELDS] #replace space with underscore to match Shopify key format
        fields_string = str(fields).replace("'","\"")
        fields_query = f"keys:{fields_string},"
    
    query = "query { customer(id: \"gid://shopify/Customer/" + str(shopify_id) + "\") { metafields(" + fields_query + "first: " + str(NUM_FIELDS_RESPONSE) + ") {nodes  {key, value, jsonValue }}}}"
    headers = {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopify_access_token
        }
        
    payload = {
      'query': query
    }
    
    response = requests.post(shop_url, json=payload,headers=headers)
    
    response_data = response.json()
    return response_data['data']['customer']['metafields']['nodes']

def add_metafields_to_profile(metafields, profile_id):
    
    request_body = {
      "data": {
        "type": "profile",
        "id": profile_id
      }
    }
    attributes = { "properties": {}}
    for field in metafields:
        key = str(field['key'])
        value = field['jsonValue']
        attributes['properties'][key] = value
    
    request_body['data']['attributes'] = attributes

    response = klaviyo.Profiles.update_profile(profile_id,request_body)
        
