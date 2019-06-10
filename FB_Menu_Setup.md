# Facebook Specific Setup
replace ```<BODY>``` with what you need to set and I don't believe you can chain all the different stuff in the same call

Curl Command: 
```

curl -X POST -H "Content-Type: application/json" -d '<BODY>' "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=FB_PAGE_ACCESS_TOKEN"

```
Powershell: 

```
Invoke-WebRequest `
  -Method Post `
  -ContentType: "application/json; charset=utf-8" `
  -Body '<BODY>' `
  -Uri "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=FB_PAGE_ACCESS_TOKEN"

```

## Greetings Text
```
{
    "greeting": [
        {
            "locale": "default",
            "text": "Hello {{user_first_name}}!"
        }
    ]
}
```

## Get Started Button
```
{
    "get_started": {
        "payload": "help"
    }
}
```

## Persistent Menu
Look at Persistent_Menu.json

The persistent menu does have more options like creating custom versions of the menu for different locales, disabling composer for some locales but not others, not having a menu for some locales (just pass an empty array to the call_to_actions for that locale), passing web_urls for buttons, etc.

Look at https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/persistent-menu for more information