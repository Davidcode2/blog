---
title: "How certbot works"
date: 2025-04-25
layout: post-layout.njk
tags: post
---

Certbot is a tool which allows me to receive a certificate
for my server by simply running a docker container.

In this post I'll explore how this work. This builds on the learnings of the
previous post [Understanding SSL](understanding_ssl/understanding_ssl).
To ensure communication between clients and my server is encrypted I need to
have SSL. For that to work I need a certificate. For the encrypted
communication a public and private key pair would in theory be sufficient. 

SSL addresses three challenges:  

- can only the user and the server read the transmitted data? 
  (confidentiality of data in transit)
- does the data arrive at the server or the client without having been tampered
  with en route? (integrity of data in transit)
- is the server the one we really want to communicate with 
  (authenticity of the server)

The first two challenges are taken care of by encryption. So let's look at the
challenge of ensuring that the client knows we are the entity we claim to be.

By establishing a chain of trust from my servers certificate to a trusted root
certificate the user can be sure to be interacting with the intended site.

There is a caveat to consider:
Attackers could hijack DNS records and point my domain name to their servers.
They could then provide a certificate themselves, which would lead to the user
seeing the site as trustworthy. Thus my certificate won't help in this
scenario.

To receive a certificate, certbot applies to a Certificate Authority on my
behalf. For this it sends a CSR (Certificate signing request) to the CA. This
contains at least the following data: 

- public key
- nonce (against replay attacks)
- domain name 
- agreement to terms of service

The CA checks whether the domain actually
belongs to me and if so, it signs the certificate. This signature is attached
to the certificate and can then be verified by clients upon requests to my
server.

There are several methods for the CAs to ensure the domain belongs to me. The
simplest form is called Domain validation. This can work by adding a DNS record
to my site which the CA will check or by placing a file on my server. I assume
this establishes that I own the domain because I can alter the records or place
files on the server where the domain points to.

Other methods include Organization Validation and Extended validation. These go 
beyond simply checking whether the certificate requester has control over the domain.
These methods also ensure that the person or entity requesting the certificate 
is real and is who it claims to be. 

Certbot requests a certificate from the CA Let's encrypt. Let's encrypt uses 
ACME (Automated Certificate Management Environment) to automatically issue 
certificates without human intervention.

Here's the process of certbot obtaining a certificate using the HTTP-01 Challenge.

1.  **Certbot Request:**
    ```bash
    sudo certbot certonly --webroot -w /var/www/yourdomain -d yourdomain.com
    ```
    You run this command in your server's terminal, replacing `/var/www/yourdomain` with your web server's root directory and `yourdomain.com` with your actual domain name.

2.  **Challenge Generation:**
    ```
    Saving debug log to /var/log/letsencrypt/letsencrypt.log
    Plugins selected: Authenticator webroot, Installer None
    Requesting a certificate for yourdomain.com

    Performing the following challenges:
    http-01 challenge for yourdomain.com
    Using the webroot path /var/www/yourdomain for all unmatched domains.
    Waiting for verification...
    ```
    Certbot communicates with Let's Encrypt and receives the HTTP-01 challenge, including a unique token. This token is not typically displayed in the standard output for security reasons.

3.  **File Creation:**
    Certbot automatically creates a file on your server at the following location:
    ```
    /var/www/yourdomain/.well-known/acme-challenge/<UNIQUE_TOKEN>
    ```
    This file contains the token provided by Let's Encrypt and a hash of your account key. The `<UNIQUE_TOKEN>` is a randomly generated string.

4.  **Challenge Response:**
    ```
    Waiting for verification...
    ```
    Certbot informs the Let's Encrypt server that it has placed the challenge file.

5.  **Let's Encrypt Verification:**
    Let's Encrypt's servers attempt to retrieve the file via HTTP:
    ```
    [http://yourdomain.com/.well-known/acme-challenge/](http://yourdomain.com/.well-known/acme-challenge/)<UNIQUE_TOKEN>
    ```
    They check if the file exists and if its content matches the expected value.

6.  **Validation Success:**
    ```
    Certbot has successfully verified your domain; performing the following actions:
    Saving debug log to /var/log/letsencrypt/letsencrypt.log
    Requesting a certificate for yourdomain.com
    ```
    If Let's Encrypt successfully retrieves and verifies the challenge file, the validation is successful.

7.  **Certificate Issuance:**
    ```
    Successfully received certificate.
    Certificate is saved at: /etc/letsencrypt/live/[yourdomain.com/fullchain.pem](https://yourdomain.com/fullchain.pem)
    Key is saved at:         /etc/letsencrypt/live/[yourdomain.com/privkey.pem](https://yourdomain.com/privkey.pem)
    This certificate expires on 2025-07-25.
    These files will be updated automatically on a renewal attempt.
    NEXT STEPS:
    - The certificate was saved in /etc/letsencrypt/live/[yourdomain.com/](https://yourdomain.com/).
    - This certificate will expire on 2025-07-25. Remember to renew
      in advance.
    - If you like Certbot, please consider supporting our work by:
      Donating to ISRG / Let's Encrypt:   [https://letsencrypt.org/donate](https://letsencrypt.org/donate)
      Donating to EFF:                    [https://eff.org/donate-le](https://eff.org/donate-le)
    ```
    Certbot then downloads the issued certificate, private key, and chain certificate from Let's Encrypt and saves them in the specified directories.
