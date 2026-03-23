---
title: "Reaching for deployment Nirvana"
date: 2025-04-25
layout: post-layout.njk
tags: post
---

I've been looking to improve my deployment game in the hopes of getting to a point where I would just push my changes and a new version would fall out on the other side. Additionally I wanted to be able to set up a new project complete with pipeline, domain etc. in no time.
This quest has led me to my current setup.

There's three layers: 
- The infrastructure layer, holding the AWS SSM Parameters. This is managed in the infra/terraform repo.
- The kubernetes layer, holding the application manifests - watched by ArgoCD. This is managed in the app-of-apps repo.
- The application layer, holding the application code and crucially, the github actions pipeline.

I create a new repository in github using github cli. Depending on the project I start by building out some core functionality and test locally. When the core logic is in place I create a dockerfile and copy over the github actions pipeline which is somewhat standardized across repos. It checks out the code, increments the version in package.json or equivalent, builds the docker image, pushes it to GHCR, and checks out the corresponding application manifest in the app-of-apps repo to update the image with the new version there. So when thats through, ArgoCD picks up the version change and pulls the new image and spins it up in my Kubernetes cluster. All while having zero downtime.

The application manifest looks essentially the same for all my applications. It points to a dedicated folder in the app-of-apps repo which holds the deployment manifest and everything else that's needed (service, ingress, pvc, etc.).
The agent can generate those beautifully when given one of the existing applications as a template.

Looking at this high level picture I am quite happy with how it works. It's definitely an improvement over my previous setup where I was sshing my code to my server and triggered a docker compose build && docker compose up there.

Let's now look at the areas which still cause some friction. I recently moved my terraform state file from my local computer to an S3 bucket. In and of itself this is nice but it introduced some hurdles regarding permissions. For security I don't wan't my CI role to be able to change its own permissions. This means that whenever I add a new SSM parameter path for a new application I need to locally run `terraform apply` with the updated permissions on the CI role. This is a bit of a pain but i suppose it's maangeable. Since I have to update the terraform ci-role, the general ci-role and the external-secrets-operator role, I could bundle these in a script so I at least don't have to write out `terraform apply -target='xyz'` three times. Alternatively I could just do `terraform apply` without arguments but not sure whether this could cause issues.

Once the role permissions are updated, the ssm part works smoothly. I have the agent create the required parameters and then simply write my secrets to them once.

One of the things I do quite often currently is setting up new website projects.
As of now I still need a few prompts to set those up. I'm thinking I could formalize what I've written above in a skill to get a website created, up and running in one shot.

Creating a simple website from a single prompt has proven to work well even
with a open weights model like Kimi-K2.5. Once I get the deployment context
well specified I should get close enough to one-shotting a website.

What are the manual tasks in my current workflow?

- Running `terraform apply` locally to update the CI-roles
- Setting the SSM parameters
- Setting the APP_ID and APP_PRIVATE_KEY as Github secrets for the workflow to be able to update the image version in the app-of-apps repo.
- Thinking about what I actually want to achieve with the project

What a time to be alive.
