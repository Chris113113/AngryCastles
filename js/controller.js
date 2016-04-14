var explode, hit, splat, ballsFired = 0, selectedAmmo = 2;
var camera, scene, renderer, keyboard, box;
var score = 0;
var plane;
var cannon;
var ballParticles = [];
var ball;
var targetList = [];
var particles = [];
var textMesh;
var firework;
var balllaunched = false;
var speedFactor = 2;
var pframes = 0;

function playSound() {
  $("#mute").show();
  $("#play").hide();
  $(".audio-player")[0].play();
}   

function loadSounds()
{
  explode = new Audio("sounds/Explosion.mp3");
  hit = new Audio("sounds/1.mp3");
  splat = new Audio("sounds/splat.mp3");
}

Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';



function GenerateGroundPlane()
{
  var texture = THREE.ImageUtils.loadTexture('images/groundterrain.jpg');
  var planeMaterial = new Physijs.createMaterial(new THREE.MeshLambertMaterial({map:texture}), .4, .8 );
  var planeGeometry = new THREE.PlaneGeometry( 500, 500, 6 );
  plane = new Physijs.BoxMesh( planeGeometry, planeMaterial, 0 );
  plane.name = "ground";
  plane.addEventListener( 'collision', function(other, rv, rr, cn){
    if(other.name=="cannonball"){
      hit.play();
    }
  })
  scene.add( plane );

}

function GenerateCannon()
{
  var cylinderGeometry = new THREE.CylinderGeometry( 2, 2, 10 );
  var cylinderMaterial = new THREE.MeshLambertMaterial({color:'lightgray'});
  var can = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
  can.position.y = -5;
  cannon = new THREE.Object3D();
  cannon.add( can );
  cannon.up = new THREE.Vector3(0,0,1);
  cannon.rotation.z = Math.PI / 2;
  cannon.position.x -= 84;
  cannon.position.z += 5;
  scene.add( cannon );

}

function GenerateCannonBall()
{
  if(balllaunched){
    scene.remove(ball);
    balllaunched = false;
  }
  GenerateProjectile(Math.random());
}

function GenerateProjectile(num) {
  if(num < .9){
    GenerateNormalBall();
  }
  else{
    GenerateExplodingBall();
  }
}

function GenerateNormalBall()
{

  var texture = THREE.ImageUtils.loadTexture('images/balltexture.jpg');
  var ballGeometry = new THREE.SphereGeometry( 3 * (speedFactor / 2) );
  //var ballGeometry = new THREE.BoxGeometry(3,3,3);
  var ballMaterial = Physijs.createMaterial( new THREE.MeshLambertMaterial({map:texture}), .95, .95 );
  ball = new Physijs.SphereMesh( ballGeometry, ballMaterial );
  ball.setCcdMotionThreshold(1);
  ball.setCcdSweptSphereRadius(0.4);
  ball.mass *= .5;
  ball.name = "cannonball";
  ball.type = "normal";
  ball.addEventListener( 'collision', col);

  function col(a,b,c,d) {
    //console.log(a.name);
  }

}
function GenerateExplodingBall()
{
  var texture = THREE.ImageUtils.loadTexture('images/firetexture.jpg');
  var ballGeometry = new THREE.SphereGeometry( 3 );
  //var ballGeometry = new THREE.BoxGeometry(3,3,3);
  var ballMaterial = Physijs.createMaterial( new THREE.MeshLambertMaterial({map:texture}), .95, .95 );
  ball = new Physijs.SphereMesh( ballGeometry, ballMaterial );
  ball.mass /= 2;
  ball.setCcdMotionThreshold(1);
  ball.setCcdSweptSphereRadius(2);
  ball.name = "cannonball";
  ball.type = "explode";
  ball.addEventListener( 'collision', col);

  ball.explode = function()
  {
    var x = ball.position.x;
    var y = ball.position.y;
    var z = ball.position.z;
    // create the particle variables
    explode.play();
    var particleCount = 100;

    // now create the individual particles
    for (var p = 0; p < particleCount; p++) {

      var particle = new Physijs.SphereMesh(new THREE.SphereGeometry(.8), new THREE.MeshLambertMaterial({color: 'red'}, .8, .3));
      // create a particle with random
      // position values, -250 -> 250
      var pX = Math.random() * 5 + x,
        pY = Math.random() * 5 + y,
        pZ = Math.random() * 5 + z;

      particle.position = new THREE.Vector3(pX, pY, pZ
        );

      particle.mass *= 50;
      

      // add it to the geometry
      ballParticles.push(particle);
      scene.add(particle);
      particle.applyCentralImpulse(new THREE.Vector3(
      (Math.random() * 20000 - 10000),
      (Math.random() * 20000 - 10000),
      (Math.random() * 20000 - 10000)
      ));
    }

    window.setTimeout(function() {
      for(var i = ballParticles.length; i--;) {
      scene.remove(ballParticles[i]);
      ballParticles.splice(i,1);
    }
    }, 2000);
  }

  function col(a,b,c,d) {
    //console.log(a.name);
    explode.play();
    // a.applyCentralImpulse(new THREE.Vector3(
    //  ball._physijs.linearVelocity.x * 1000,
    //  ball._physijs.linearVelocity.y * 1000,
    //  ball._physijs.linearVelocity.z * 1000
    //  ));
    ball.explode(ball.position.x, ball.position.y, ball.position.z);
    scene.remove(ball);
    GenerateCannonBall();
    balllaunched = false;
    
  }

}

function GenerateTarget()
{
  var targ =  new Physijs.SphereMesh(new THREE.SphereGeometry(5), new THREE.MeshLambertMaterial({color: 'red'}, .8, .3));

  
  
   //Issues with sphere collisions... Making it a box.
  //var targ = new Physijs.BoxMesh(new THREE.BoxGeometry(5,5,5), new THREE.MeshLambertMaterial({color: 'red'}, .8, .3));

  targ.setCcdMotionThreshold(1);
  targ.setCcdSweptSphereRadius(1);
  //targ.setActivationState( DISABLE_DEACTIVATION );

  targ.explode = function() {
    score++;
    updateScore();
    GenerateCloud(this.position.x,this.position.y,this.position.z);
    pframes = 1000;
    scene.remove(targ);
    for(var j = 0; j < particles.length; j++){
      particles[j].applyCentralImpulse(new THREE.Vector3(
      (Math.random() * 1000 - 500),
      (Math.random() * 1000 - 500),
      (Math.random() * 1000 - 500)
      ));
    }
    splat.play();
    if(targetList.length == 1)
    {
      replaceCastle();
    }
    targetList.splice(targetList.indexOf(targ), 1);

  }

  targ.collisionHandler = function(other_object, rv, rr, cn) {
    if(rv.x+rv.y+rv.z > 20) {
      //console.log("powerful hit");
      targ.explode();
    }
    if(other_object.name == "cannonball"){
      //console.log("cannonball hit");
      targ.explode();
    }
    if(other_object.name == "ground"){
      //console.log("ground hit");
      targ.explode();
    }
  };

  targ.addEventListener( 'collision', targ.collisionHandler );

  return targ;
}

function GenerateCloud(x, y, z, color)
{
  // create the particle variables
  var particleCount = 25;

  if(color == undefined){
    color = 'red'
  }

  // now create the individual particles
  for (var p = 0; p < particleCount; p++) {

    var particle = new Physijs.SphereMesh(new THREE.SphereGeometry(.8), new THREE.MeshLambertMaterial({color: color}, .8, .3));
    // create a particle with random
    // position values, -250 -> 250
    var pX = Math.random() * 5 + x,
      pY = Math.random() * 5 + y,
      pZ = Math.random() * 5 + z;

    particle.position = new THREE.Vector3(pX, pY, pZ
      );

    //particle.mass *= 50;


    // add it to the geometry
    particles.push(particle);
    scene.add(particle);
  }
}

function GenerateScoreboard() {
  var material = new THREE.MeshPhongMaterial({
    color: 0xdddddd
  });
  var textGeom = new THREE.TextGeometry( 'Score: '+score, {
    size: 12,
    height: 1,
    font: 'droid serif', // Must be lowercase!
    weight: 'bold'
  });
  textMesh = new THREE.Mesh( textGeom, material );
  textMesh.rotation.x = Math.PI / 2;
  textMesh.rotation.y = 3*Math.PI / 2;
  textMesh.position.z = 100;
  textMesh.position.x = 100;
  textMesh.position.y = 0;
  scene.add( textMesh );
}

function updateScore() {
  scene.remove(textMesh);
  GenerateScoreboard();
}

function GenerateFirework(x, y, z, color)
{
  // create the particle variables
  firework = [];
  var particleCount = 100;

  if(color == undefined){
    color = 'red'
  }

  // now create the individual particles
  for (var p = 0; p < particleCount; p++) {

      var particle = new Physijs.SphereMesh(new THREE.SphereGeometry(.8), new THREE.MeshLambertMaterial({color: color}, .8, .3));
      // create a particle with random
      // position values, -250 -> 250
      var pX = Math.random() * 5 + x,
        pY = Math.random() * 5 + y,
        pZ = Math.random() * 5 + z;

      particle.position = new THREE.Vector3(pX, pY, pZ
        );

      particle.mass /= 20;

      // add it to the geometry
      firework.push(particle);
      scene.add(particle);
      particle.applyCentralImpulse(new THREE.Vector3(
      (Math.random() * 50 - 25),
      (Math.random() * 50 - 25),
      (Math.random() * 50 - 25)
      ));
    }

    setTimeout(function() {
      for(var i = 0; i < firework.length; i++) {
        scene.remove(firework[i]);
      }
    }, 1000)
}

function replaceCastle() {

  window.setTimeout( function() {
    GenerateFirework(0,0,25, 'white');
    window.setTimeout(castleFactory, 3500);
  }, 1000);

  for(var i = box.length; i--;) {
    scene.remove(box[i]);
    box.splice(i)
  }
}
  
function castleFactory()
{
  box = getNewCastle(Math.random());
}

function getNewCastle(num) {
  if(num < .1){
    return getMiniCastle();
  }
  // if(num > .65){
  //  return getSmallCastle();
  // }
  return getMediumCastle();
}

function getMiniCastle() {
  var castle = [];
  targetList = [];

  for(var i = 0; i < 2; i++) {
    var mesh = new Physijs.BoxMesh(new THREE.BoxGeometry(10,30,10), new THREE.MeshLambertMaterial({color: 'green'}));
    castle.push( mesh );
  }
  for(var i = 0; i < 2; i++) {
    var mesh = new Physijs.BoxMesh(new THREE.BoxGeometry(10,10,20), new THREE.MeshLambertMaterial({color: 'green'}));
    castle.push( mesh );
  }

  targetList.push(GenerateTarget());
  targetList[0].position = new THREE.Vector3(35,0,15);

  castle[0].position.x += 35;
  castle[1].position.x += 35;
  castle[2].position.x += 35;
  castle[3].position.x += 35;
  castle[0].position.z += 35;
  castle[2].position.y += 15;
  castle[1].position.z += 5;
  castle[2].position.z += 20;
  castle[3].position.y -= 15;
  castle[3].position.z += 20;

  scene.add(castle[0]);
  scene.add(castle[1]);
  scene.add(castle[2]);
  scene.add(castle[3]);
  scene.add(targetList[0]);

  return castle;
  
}

function getSmallCastle() {
  var castle = [];
  targetList = [];

  for(var i = 0; i < 25; i++){
    var mesh = new Physijs.BoxMesh(new THREE.BoxGeometry(10,20,10), new THREE.MeshLambertMaterial({color: 'green'}));
    mesh.addEventListener( 'collision' , function(a,b,c,d) {
        console.log("collision");
    })
    castle.push( mesh );
  }
  var sqrt = Math.sqrt(castle.length);
  for(var i = 0; i < sqrt; i++){
    for(var j = 0; j < sqrt; j++){
      castle[i*sqrt + j].position.z += (10*j)+5;
      castle[i*sqrt + j].position.y += 20*i-35;
      castle[i*sqrt + j].position.x += 100;
      castle[i*sqrt + j].mass /= 10;
      castle[i*sqrt + j].name = "block"+(i*sqrt)/10+j;
      scene.add(castle[i*sqrt + j]);  
    }
    targetList.push(GenerateTarget());
    targetList[i].position.x += 100;
    targetList[i].position.z += 10*(sqrt+1);
    targetList  [i].position.y += 20*i-35;
    scene.add(targetList[i]);
  }

  return castle;
}

function getMediumCastle() {
  var castle = [];
  targetList = [];
  
  for(var i = 0; i < 145; i++){
    var mesh = new Physijs.BoxMesh(new THREE.BoxGeometry(10,20,10),
     new THREE.MeshLambertMaterial({color: 'green'}));
    mesh.mass /= 10;
    castle.push( mesh );
  }
  
  var index = 0;
  for(var i = 0; i < 5; i++){
    for(var j = 0; j < 5; j++){
      
      castle[index].position.z += (10*j)+5;
      castle[index].position.y += -50+(20*i);
      castle[index].position.x += 100;
      scene.add(castle[index]);   
      index++;
    }
  }

  for(var i = 0; i < 5; i++){
    for(var j = 0; j < 5; j++){
      
      castle[index].position.z += (10*j)+5;
      castle[index].position.y += -50;
      castle[index].position.x += 115 + (20*i);
      castle[index].rotation.z += Math.PI / 2;
      scene.add(castle[index]);
      index++;  
    }
  }

  for(var i = 0; i < 5; i++){
    for(var j = 0; j < 5; j++){
      
      castle[index].position.z += (10*j)+5;
      castle[index].position.y += 25;
      castle[index].position.x += 115 + (20*i);
      castle[index].rotation.z += Math.PI / 2;
      scene.add(castle[index]);
      index++;  
    }
  }

  for(var i = 0; i < 5; i++) {
    castle[index].position.z += (10*i)+5;
    castle[index].position.y += -50;
    castle[index].position.x += 90;
    scene.add(castle[index]);
    index++;

    castle[index].position.z += (10*i)+5;
    castle[index].position.y += 30;
    castle[index].position.x += 90;
    scene.add(castle[index]);   
    index++;
  }
  for(var i = 0; i < 5; i++){
    for(var j = 0; j < 5; j++){
      
      castle[index].position.z += (10*j)+5;
      castle[index].position.y += -145+(20*i);
      castle[index].position.x += 150;
      scene.add(castle[index]);   
      index++;
    }
  }
  for(var i = 0; i < 5; i++){
    for(var j = 0; j < 5; j++){
      
      castle[index].position.z += (10*j)+5;
      castle[index].position.y += 40+(20*i);
      castle[index].position.x += 150;
      scene.add(castle[index]);   
      index++;
    }
  }
  for(var i = 0; i < 5; i++) {
    castle[index].position.z += (10*i)+5;
    castle[index].position.y += 120;
    castle[index].position.x += 140;
    scene.add(castle[index]);
    index++;

    castle[index].position.z += (10*i)+5;
    castle[index].position.y += -145;
    castle[index].position.x += 140;
    scene.add(castle[index]);   
    index++;
  }

  var mesh = new Physijs.BoxMesh(new THREE.BoxGeometry(20,20,100), new THREE.MeshLambertMaterial({color: 'green'}));
    castle.push( mesh );
    
  castle[index].position.x = 130;
  castle[index].position.y = -15;
  castle[index].position.z = 50;
  scene.add(castle[index]);

  targetList.push(GenerateTarget());
  targetList.push(GenerateTarget());
  targetList.push(GenerateTarget());

  targetList[0].position = new THREE.Vector3(90, 30, 55);
  targetList[1].position = new THREE.Vector3(90, -50, 55);
  targetList[2].position = new THREE.Vector3(125, -15, 105);

  scene.add(targetList[0]);
  scene.add(targetList[1]);
  scene.add(targetList[2]);     

  return castle;

  // targetList.push(GenerateTarget());
  //  targetList[i].position.x += 100;
  //  targetList[i].position.z += 10*(5+1);
  //  targetList  [i].position.y += 20*i;
  //  scene.add(targetList[i]);
}

function getMegaCastle() {

}

function init()
{
  keyboard = new THREEx.KeyboardState();

  // New scene creation and initialization for Physijs.
  // Generate Scene
  scene = new Physijs.Scene();
  scene.setGravity(new THREE.Vector3( 0, 0, -30 ));
  scene.addEventListener('update', function() 
  {   
    scene.simulate(undefined, 1);
  });

  
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
  camera.position.x = 0;
  camera.position.y = 7;
  camera.position.z = 3.5;
  camera.up = new THREE.Vector3(0,0,1);
  camera.lookAt(new THREE.Vector3(0, -10, 7));
  //camera.lookAt(new THREE.Vector3(0, -150, 0));
  //camera.rotateZ(45);
  
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( 0x000000, 1.0 );
  renderer.setSize( window.innerWidth*.98, window.innerHeight*.98 );
  renderer.shadowMapEnabled = true;

  // Load Sounds
  loadSounds();

  // 1. Drop in ground plane
  GenerateGroundPlane();

  // Generate cannon
  GenerateCannon();
  
  // Generate cannon ball
  GenerateCannonBall();
  
  // Generate Castle
  castleFactory();
  
  // Generate Scoreboard
  GenerateScoreboard();

  // Generate target
  // GenerateTarget();

  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( -100, 0, 300 );
  spotLight.shadowCameraNear = 10;
  spotLight.shadowCameraFar = 100;
  spotLight.castShadow = true;
  spotLight.intensity = 3;
  scene.add(spotLight);

  var scoreLight = new THREE.SpotLight( 0xffffff );
  scoreLight.position.set( 0, 0, 400 );
  scoreLight.shadowCameraNear = 10;
  scoreLight.shadowCameraFar = 100;
  scoreLight.castShadow = true;
  scoreLight.intensity = 3;
  //scene.add(scoreLight);

  cannon.add( camera );
  document.body.appendChild( renderer.domElement );

  // var loader  = new THREEx.UniversalLoader();
  // var url = ['female02.obj', 'female02.mtl'];
  
  // loader.load(url, function(object3d)
  // {
  //  // this function will be notified when the model is loaded
  //  scene.add(object3d);
  //  render();
  // });

  requestAnimationFrame(render);
  scene.simulate(undefined, 1);
}


function render()
{   

  if(pframes > 0){
    pframes-= 1;
    handleParticles();
  }

  for(var i = 0; i < targetList.length; i++) {
      if(targetList[i].position.z <= 5) {
        targetList[i].explode();
      }
    }

  if( keyboard.pressed("left") )
  {
    //camera.position.y -= 1;
    if(cannon.rotation.z - Math.PI/2 < Math.PI/4){
      cannon.rotation.z += .003;
      cannon.rotation.z += .003;
    }
    //camera.rotation.x += .003;
  }
  else if( keyboard.pressed("right") )
  {
    //camera.position.y += 1;
    if(cannon.rotation.z - Math.PI/2 > -Math.PI/4)
    {
      cannon.rotation.z -= .003;
      cannon.rotation.z -= .003;
    }
    //camera.rotation.z -= .003;
  }
  else if( keyboard.pressed("up") )
  {
    //camera.position.x += 1;
    if(cannon.rotation.y > -( Math.PI / 3 ))
    {
      cannon.rotation.y -= .005;
      cannon.rotation.y -= .005;
    }
    //camera.rotation.y -= .005;
  }   
  else if( keyboard.pressed("down") )
  {
    //camera.position.x -= 1;
    if(cannon.rotation.y < 0)
    {
      cannon.rotation.y += .005;
      cannon.rotation.y += .005;
    }
    //camera.rotation.y += .005;
  }
  else if( !balllaunched && keyboard.pressed("space") )
  {
    ballsFired++;
    $("#numShots span").text(ballsFired);
    //console.log(cannon.rotation.z - Math.PI/2);
    ball.position.x = (cannon.position.x+10) - Math.abs(((cannon.rotation.z - Math.PI/2) * Math.PI)); //* cannon.rotation.z;
    ball.position.y = cannon.position.y + (3.2*((cannon.rotation.z - Math.PI/2) * Math.PI));
    ball.position.z = cannon.position.z + 3*(-cannon.rotation.y * Math.PI);
    scene.add(ball);
    //ball.applyCentralImpulse(vector);
    ball.applyCentralImpulse( 
      new THREE.Vector3(  (1*5000*Math.abs(Math.cos(cannon.rotation.z - Math.PI/2)))*(1/20*Math.pow(ball.geometry.boundingSphere.radius,3)), (-( Math.PI / 2 - cannon.rotation.z ) * 4500)*(1/20*Math.pow(ball.geometry.boundingSphere.radius,3)), ((-cannon.rotation.y * 7000) * (1/20*Math.pow(ball.geometry.boundingSphere.radius,3))) * Math.cos(cannon.rotation.z - Math.PI/2)  ) 
      //(new THREE.Vector3(Math.cos(-vector.y)*10000, vector.x, vector.z))
      );

    balllaunched = true;

  }

  else if( balllaunched && keyboard.pressed("escape") )
  {   
    balllaunched = false;
    if(ball.type == "explode") {
      ball.explode();
    }
    else{
      scene.remove(ball);
    }
    GenerateCannonBall();
  }
  
  if( balllaunched )
  {
    for(var i=0; i < targetList.length; i++){
      if(ball.position.distanceTo(targetList[i].position) < (ball.geometry.boundingSphere.radius + targetList[i].geometry.boundingSphere.radius+1)){
        targetList[i].explode();
      }
    }

    if(ball.position.z < -5){
      scene.remove(ball);
      GenerateCannonBall();
      balllaunched = false;
    }
  }

  requestAnimationFrame( render );
  renderer.render(scene, camera );      
  
}

function handleParticles() {

  if(pframes == 0) {
    for(var i = particles.length; i--;) {
      scene.remove(particles[i]);
      particles.splice(i,1);
    }
  }
}

$("#largeAmmo").click(function () {
  $("#largeAmmo").blur();
  speedFactor = 4;
  GenerateCannonBall();
});
$("#normalAmmo").click(function () {
  $("#normalAmmo").blur();
  speedFactor = 1;
  GenerateCannonBall();
});
$("#smallmmo").click(function () {
  $("#smallAmmo").blur();
  speedFactor = .25;
  GenerateCannonBall();
});
$("#play").hide();
function muteSound() {
  $("#mute").hide();
  $("#play").show();
  $(".audio-player")[0].pause();
}

window.onload = init;
