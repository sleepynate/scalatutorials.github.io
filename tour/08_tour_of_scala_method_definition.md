---
layout: tour
title: "Method definition"
description: "Scala language tour"
pageNumber: 8
isLast: false
group: tour
nextPage: 09_tour_of_scala_method_definition_2.html
prevPage: 07_tour_of_scala_string_formatting.html
links:

code:
  |
  def add(x:Int, y:Int):Int = {  
    return x + y  
  }  
  println(add(42,13))  
---

- In Scala methods are defined using `def` 
- Methods that return a value must have an equal sign before the body of the method 
- Methods that have either a return statement or are recursive must declare a return type
