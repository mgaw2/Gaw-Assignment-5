import Map from "https://js.arcgis.com/5.1/@arcgis/core/Map.js";
import Graphic from "https://js.arcgis.com/5.1/@arcgis/core/Graphic.js";
import GraphicsLayer from "https://js.arcgis.com/5.1/@arcgis/core/layers/GraphicsLayer.js";
import SceneView from "https://js.arcgis.com/5.1/@arcgis/core/views/SceneView.js";
import * as reactiveUtils from "https://js.arcgis.com/5.1/@arcgis/core/core/reactiveUtils.js";

const places = new GraphicsLayer({ elevationInfo: { mode: "on-the-ground" } });
const map = new Map({ basemap: "topo", ground: "world-elevation", layers: [places] });
const startCamera = {
  position: { longitude: -94, latitude: 38, z: 4200000 },
  heading: 0,
  tilt: 0
};

// Start over the United States.
const view = new SceneView({
  container: "map",
  map: map,
  camera: startCamera,
  popupEnabled: false,
  popup: {
    dockEnabled: true,
    dockOptions: { position: "bottom-right", breakpoint: false }
  }
});

// Make one graphic for each object.
const points = [];
for (const [category, place] of Object.entries(myStuff)) {
  points.push(new Graphic({
    geometry: {
      type: "point",
      longitude: place.coord[0],
      latitude: place.coord[1]
    },
    attributes: { city: place.city },
    symbol: {
      type: "simple-marker", style: "circle", color: "#087f8c", size: 14,
      outline: { color: "white", width: 2 }
    },
    popupTemplate: {
      title: category,
      content: "<b>" + place.city + ", " + place.state + "</b><br>" +
        "Latitude: " + place.coord[1] + "<br>Longitude: " + place.coord[0]
    }
  }));
}


// For these four points, group symbols within 65 screen pixels.
let groups = [];
function drawPlaces() {
  groups = [];
  for (const point of points) {
    const screen = view.toScreen(point.geometry);
    if (!screen) continue;
    let nearby = null;
    for (const group of groups) {
      const distance = Math.hypot(screen.x - group.screen.x, screen.y - group.screen.y);
      if (distance < 65) {
        nearby = group;
        break;
      }
    }
    if (nearby) nearby.points.push(point);
    else groups.push({ screen: screen, points: [point] });
  }

  places.removeAll();
  groups.forEach(function(group, index) {
    if (group.points.length === 1) {
      places.add(group.points[0]);
      return;
    }
    // Put the cluster at the average longitude and latitude of its members.
    let longitude = 0;
    let latitude = 0;
    for (const point of group.points) {
      longitude += point.geometry.longitude;
      latitude += point.geometry.latitude;
    }
    const geometry = {
      type: "point",
      longitude: longitude / group.points.length,
      latitude: latitude / group.points.length
    };
    places.add(new Graphic({
      geometry: geometry,
      attributes: { groupIndex: index },
      symbol: {
        type: "simple-marker", color: "#b84b0b", size: 30,
        outline: { color: "white", width: 2 }
      }
    }));
    places.add(new Graphic({
      geometry: geometry,
      attributes: { groupIndex: index },
      symbol: {
        type: "text", text: String(group.points.length), color: "white",
        verticalAlignment: "middle", horizontalAlignment: "center",
        font: { size: 12, weight: "bold" }
      }
    }));
  });
}

// Both marker clicks and city searches use this zoom function.
async function zoomToPoint(point) {
  view.closePopup();
  await view.goTo({ target: point.geometry, zoom: 12, tilt: 30 }, { duration: 1200 });
  await view.openPopup({ features: [point], location: point.geometry });
}

view.when(function() {
  const originalCamera = view.camera.clone(); // Save the starting view.
  drawPlaces();
  // Recalculate clusters after zooming, panning, rotating, or resizing.
  reactiveUtils.watch(() => [view.stationary, view.width, view.height], function() {
    if (view.stationary) drawPlaces();
  });

  view.on("click", async function(event) {
    const response = await view.hitTest(event, { include: [places] });
    const hit = response.results.find(result => result.type === "graphic");
    if (!hit) return;
    const graphic = hit.graphic;
    if (graphic.attributes.groupIndex !== undefined) {
      const members = groups[graphic.attributes.groupIndex].points;
      view.closePopup();
      await view.goTo({ target: members, tilt: 0 }, { duration: 1200 });
    } else {
      await zoomToPoint(graphic);
    }
  });

  document.getElementById("searchForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Stop the form from reloading the page.
    const name = document.getElementById("citySearch").value.trim().toLowerCase();
    const point = points.find(point => point.attributes.city.toLowerCase() === name);
    if (point) zoomToPoint(point);
  });

  document.getElementById("reset").addEventListener("click", function() {
    view.closePopup();
    view.goTo(originalCamera, { duration: 1200 });
  });
});
