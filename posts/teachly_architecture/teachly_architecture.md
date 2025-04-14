---
title: Teachly app architecture
date: 2025-03-22
tags: post
layout: post-layout.njk
---

In the following I want to document the architecture of the teachly.store
project. I'll use the C4 diagrams to get an understanding of how everything fits
together.

**Context**

```plantuml
@startuml

!include  https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

Person(personAlias, "User", "Teacher or Refendar")
System(systemAlias, "Teachly")
System_Ext(paymentProvider, "Payment Provider")

personAlias --> systemAlias : browse materials
personAlias --> systemAlias : upload materials
personAlias --> systemAlias : buy materials
systemAlias -> paymentProvider : delegate payment handling

@enduml
```

**Containers**

```plantuml
@startuml

!include  https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

Person(person, "User", "Teacher or Refendar")

System_Boundary(boundary, "Teachly System", $link="https://github.com/davidcode2/teachme") {

    Container(webapi, "Web API", "Nest.js", $descr="Provides API for uploading, searching and buying materials", $link="https://github.com/davidcode2/teachme/be")

    Container(webfe, "Single Page App", "React", $descr="Web UI", $link="https://github.com/davidcode2/teachme/fe")

    Container(idp, "Identity Provider", "Keycloak", $descr="Identity provider for authentication and authorization", $link="https://github.com/davidcode2/teachme/keycloak")

    ContainerDb(database, "Database", "Postgres", $descr="Database for storing material references, users, carts, etc.", $link="https://github.com/davidcode2/teachme")

    ContainerDb(file_store, "File storage", "Docker volume", $descr="Folder storing materials (PDF), previews and thumbnails (PNG)", $link="https://github.com/davidcode2/teachme")

}

Container_Ext(paymentProvider, "Payment provider", "Stripe", $descr="Payment provider handling payments", $link="https://github.com/davidcode2/teachme/be")

person --> webfe : access web ui
webfe -> idp : redirect user for sign in
webfe --> webapi : requests resources\n updates state
webapi -u-> idp : check user authorization
webapi -l-> database : store + retrieve
webapi -> paymentProvider : delegate payment
webapi --> file_store : store + retrieve

@enduml
```

There's a reverse proxy in front of the other containers which terminates SSL.
Each container runs in a docker container behind its own nginx server.

**Components**

The component diagram looks like a mess. I wonder whether a messy architecture
diagram equals a messy architecture or if this could be okay as it is.

```plantuml
@startuml

!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

Container_Boundary(boundary, "Web API") {

  together {
    Component(userController, "Users Controller", $descr="GET, POST, PATCH")
    Component(authorController, "Author Controller", $descr="GET")
    Component(materialController, "Materials Controller", $descr="GET, POST, PATCH, DELETE")
    Component(cartController, "Carts Controller", $descr="GET, POST, DELETE")
    Component(stripeController, "Stripe Controller", $descr="GET, POST")
    Component(authController, "Auth Controller", $descr="GET, POST")
  }

  together {
    Component(materialService, "Materials Service", $descr="")
    Component(cartService, "Carts Service", $descr="")
    Component(userService, "Users Service", $descr="")
    Component(stripeService, "Stripe Service", $descr="")
  }

  Component(commonCartService, "Common Carts Service", $descr="")
  Component(consumerService, "Consumers Service", $descr="")
  Component(authService, "Auth Service", $descr="")
  Component(authorService, "Author Service", $descr="")
  Component(imageService, "Image Service", $descr="")
  Component(materialFinderService, "Material PriceId Finder Service", $descr="")

}

ContainerDb(database, "Database", "Postgres", $descr="Database for storing material references, users, carts, etc.", $link="https://github.com/davidcode2/teachme")

Container_Ext(stripe, "Stripe API")

cartController --> cartService

materialController --> materialService
materialService --> imageService
materialService -> userService
materialService -> stripeService

userController --> userService
userService --> consumerService
userService --> authorService

cartService --> stripeService
cartService --> userService
cartService --> materialService
cartService --> commonCartService


stripeController --> stripeService
stripeService --> userService
stripeService --> materialFinderService
stripeService --> commonCartService
stripeService -> stripe

authorController --> authorService
authController --> authService

@enduml
```

**Code**

Simon Brown - the creator of C4 - says to not draw code level diagrams when not
absolutely necessary. Makes sense to me.
