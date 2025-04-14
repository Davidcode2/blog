---
title: Securing a web app
date: 2025-03-23
tags: post
layout: post-layout.njk
---

Let's see how a user could potentially mess around with
my web app. We'll explore different attack vectors and 
see how we could mitigate them.


```plantuml
@startuml

!include  https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

!define osaPuml https://raw.githubusercontent.com/Crashedmind/PlantUML-opensecurityarchitecture2-icons/master
!include osaPuml/Common.puml
!include osaPuml/User/all.puml
!include osaPuml/Hardware/all.puml
!include osaPuml/Misc/all.puml
!include osaPuml/Server/all.puml
!include osaPuml/Site/all.puml

Person(bad_actor, "Jimmy", "Bad actor", $sprite="osa_user_black_hat")

System_Boundary(boundary, "Teachly System", $link="https://github.com/davidcode2/teachme") {
    Container(webapi, "Web API")
}

bad_actor -> webapi : access stuff without permission
bad_actor -> webapi : inject malicious stuff
bad_actor -> webapi : spam the endpoints
bad_actor -> webapi : write tons of stuff to my database

@enduml
```

## Endpoint spamming

First we'll look at the issue of "Endpoint spamming". This is when an attacker
tries to overload the server with requests. The server will try to serve all
those requests and will at some point fail to serve requests of other users
because it runs out of compute resources. This is known as a "Denial of
Service" or DoS attack. Fortunately it is easy to mitigate using nginx rate
limits. For this we define a rate limit in our nginx configuration. This will
check for requests coming from the same IP address and define a time window
within which a number of requests per second to one IP address will be served.
This looks as follows: 

```nginx
limit_req_zone $binary_remote_addr zone=mylimit:5m rate=10r/s;
```

The above will throttle requests from an IP if it makes more than 10 requests
per second. Note that the limit is applied on millisecond level: the example
will allow exactly one request per 100ms. A shared memory zone is defined which
has a capacity of 5 megabytes. This storage is used to keep track of the IP
addresses of incoming requests. The `binary_remote_addr` says that the IP
addresses will be stored in binary format. This saves disk space and allows for
more IP addresses to be tracked.

So what happens if a client sends tow requests in 100ms? If the
`limit_req_zone` directive is used as it is, the request exceeding the quota
will be rejected. The server will return a 503 Error (Service Temporarily
Unavailable). This can be a problem. When loading a page, there might be many
calls to the server in quick succession to load pages, scripts, images, and
make API calls etc. So how can we solve this? Here the `burst` parameter comes
into play.

It's important to understand that the above directive only creates a shared
memory zone. It does not enforce the rate limit. To apply the rate limit we
need another directive on the server or location level:`limit_req`.

This is used as follows.

```nginx
location / {
  limit_req zone=mylimit burst=5 nodelay;
  proxy_pass http://frontend:80;
}
```

We can see here that the `limit_req` directive takes parameters. The first one
we pass here is `burst`. This allows excess requests to burst through. If we
get 6 requests from a client, the first one will be served immediately and the
other five are being queued. One request from the queue is processed every 100ms.
This can introduce lag. That's why we also have the `nodelay` argument. This ensures
that the queue gets worked through immediately.
Further info can be found here: https://blog.nginx.org/blog/rate-limiting-nginx

This should solve the issue of DoS attacks. But what about DDoS? Distributed
Denial of Service is the term for DoS attacks that are orchestrated by multiple
clients, thus rendering the IP based rate limiting useless. I'll have to look
into how this can be mitigated. I assume one would have to check for unusual
traffic spikes and try to block clients with abnormal request patterns.

## Preventing unauthorized access

To prevent unauthorized access, I rely on authentication and authorization with
an Identity Provider (IdP). I use Keycloak as my IdP. There are public
endpoints on my site which can be accessed by anyone. Endpoints which are only
meant for access by authorized users are private. In order to access a private
endpoint a user first needs to authenticate with the IdP. Authentication means
that the user needs to prove that he is the person he claims to be. When a user
wants to authenticate he gets redirected to Keycloak and is prompted for his
credentials. If the credentials are valid, Keycloak redirects the user back to
the web application with an id token. This id token is then sent by the
frontend back to Keycloak. Keycloak checks the token and if valid, issues an
authentication token. When making requests to the backend, the client will include the
token. The backend will check the token before handling the request. It sends
the token to Keycloak for verification. If the token comes back as valid, the
backend will process the request.

## Checking for malicious injections

A bad actor could pass stuff to my endpoints which would execute malicious code
on my server. To prevent this, I need to check the requests, validate inputs
and sanitize them.

## Protecting users from malicious output

Users of my application could be exposed to malicious code if I do not encode
output that I display in the frontend. For example, I might have a field where
I allow users to change their username. A bad actor could inject a HTML `<script>` tag with
javascript. Another user would then access the page and the
code would execute. What harm could be done there? The code could:

- download malicious software to the clients computer.
- log user input on the page, leading to the theft of credentials and other sensitive data, like financial data.
- steal sessions cookies
- modify the pages content
- initiate actions on behalf of the user - like making purchases

Attacks like this are called Cross Site Scripting Attacks (XSS). Fortunately
when using React, JSX already performs output encoding by default. That means
when I show content that is user provided, it automatically is escaped. Thus
injected scripts are stopped from running.
