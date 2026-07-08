import json
import math

def generate_map_data():
    tiles = {
        "1": { "row": 1, "col": 1, "filename": "map-1.jpeg" },
        "2": { "row": 2, "col": 1, "filename": "map-2.jpeg" },
        "3": { "row": 3, "col": 1, "filename": "map-3.jpeg" },
        "4": { "row": 4, "col": 1, "filename": "map-4.jpeg" },
        "5": { "row": 5, "col": 1, "filename": "map-5.jpeg" },
        "6": { "row": 6, "col": 1, "filename": "map-6.jpeg" },
        "7": { "row": 7, "col": 1, "filename": "map-7.jpeg" },
        "8-1": { "row": 8, "col": 1, "filename": "map-8-1.jpeg" },
        "8-2": { "row": 9, "col": 1, "filename": "map-8-2.jpeg" },
        "8-3": { "row": 10, "col": 1, "filename": "map-8-3.jpeg" },
        "9": { "row": 11, "col": 1, "filename": "map-9.jpeg" },
        "10": { "row": 12, "col": 1, "filename": "map-10.jpeg" },
        "11": { "row": 13, "col": 1, "filename": "map-11.jpeg" },
        "12": { "row": 13, "col": 2, "filename": "map-12.jpeg" },
        "13": { "row": 13, "col": 3, "filename": "map-13.jpeg" },
        "14": { "row": 13, "col": 4, "filename": "map-14.jpeg" },
        "15": { "row": 13, "col": 5, "filename": "map-15.jpeg" },
        "16": { "row": 13, "col": 6, "filename": "map-16.jpeg" },
        "17": { "row": 13, "col": 7, "filename": "map-17.jpeg" },
        "18": { "row": 13, "col": 8, "filename": "map-18.jpeg" }
    }

    # Generate L-shaped island.
    # Column 1 height: 12 * 4032 = 48384 px. Row 13 height: 3024 px. Total height: 51408 px.
    # Row 13 width: 8 * 4032 = 32256 px.
    land_points = []
    
    # Left edge (x ~ 100, going from bottom y=51200 to top y=100)
    for y in range(51200, 100, -1000):
        wobble = int(50 * math.sin(y / 800.0))
        land_points.append({"x": 100 + wobble, "y": y})
        
    # Top edge (y ~ 100, going from left x=100 to right x=32100)
    for x in range(100, 32100, 1000):
        wobble = int(40 * math.sin(x / 600.0))
        land_points.append({"x": x, "y": 100 + wobble})
        
    # Right edge at top (x ~ 32100, going down from y=100 to y=2900)
    for y in range(100, 2900, 500):
        wobble = int(30 * math.sin(y / 400.0))
        land_points.append({"x": 32100 + wobble, "y": y})
        
    # Inner corner horizontal edge (y ~ 2900, going from right x=32100 to left x=2900)
    for x in range(32100, 2900, -1000):
        wobble = int(40 * math.sin(x / 700.0))
        land_points.append({"x": x, "y": 2900 + wobble})
        
    # Inner corner vertical edge (x ~ 2900, going down from y=2900 to y=51200)
    for y in range(2900, 51200, 1000):
        wobble = int(50 * math.sin(y / 900.0))
        land_points.append({"x": 2900 + wobble, "y": y})
        
    # Bottom edge (y ~ 51200, going from x=2900 to left x=100)
    for x in range(2900, 100, -500):
        land_points.append({"x": x, "y": 51200})

    landmasses = [
        {
            "id": "island-main",
            "name": "Ephraim Island",
            "points": land_points
        }
    ]

    # Detailed Road Networks - aligned tile-by-tile.
    # Consistent 3-corridor structure: Left corridor (x=800), Center Freeway (x=1512), Right corridor (x=2200)
    # Note: Local roads start at Exit 1 (y=50200). Only Mommy Ave freeway runs south of Exit 1 to South Harbor port.
    roads = [
        # --- FREEWAY BACKBONE (Mommy Ave) ---
        # Starts bottom of Tile 1, runs North at x=1512 to Tile 11, then East at y=1512 to Tile 18
        {
            "id": "mommy-ave",
            "name": "Mommy Ave (I-95)",
            "type": "freeway",
            "points": [
                { "x": 1512, "y": 51408, "description": "Mommy Ave entrance at South Harbor" },
                { "x": 1512, "y": 50200, "description": "Exit 1: Chana Rochel" },
                { "x": 1512, "y": 49400, "description": "Exit 2: City of Shira" },
                { "x": 1512, "y": 47376, "description": "Boundary Tile 1/2" },
                { "x": 1512, "y": 46000, "description": "Exit 3: Peace Ave" },
                { "x": 1512, "y": 45144, "description": "Exit 4: Happy St / The White House" },
                { "x": 1512, "y": 43344, "description": "Boundary Tile 2/3" },
                { "x": 1512, "y": 42000, "description": "Exit 5: Tatty Ave" },
                { "x": 1512, "y": 41328, "description": "Exit 6: Shobbos Ave" },
                { "x": 1512, "y": 39312, "description": "Boundary Tile 3/4" },
                { "x": 1512, "y": 37280, "description": "Exit 8: Shobbos Blvd" },
                { "x": 1512, "y": 36000, "description": "Exit 9: Harbor Bay Cross Harbor" },
                { "x": 1512, "y": 35280, "description": "Boundary Tile 4/5" },
                { "x": 1512, "y": 33264, "description": "Exit 10: Jungle Path" },
                { "x": 1512, "y": 31248, "description": "Boundary Tile 5/6" },
                { "x": 1512, "y": 29216, "description": "Exit 11: Volcano Rd" },
                { "x": 1512, "y": 27216, "description": "Boundary Tile 6/7" },
                { "x": 1512, "y": 25184, "description": "Exit 12: Midpoint Bridge / Internet Ave" },
                { "x": 1512, "y": 23184, "description": "Boundary Tile 7/8-1" },
                { "x": 1512, "y": 21100, "description": "Exit 13: Disneyland 1st Entrance" },
                { "x": 1512, "y": 19152, "description": "Boundary Tile 8-1/8-2" },
                { "x": 1512, "y": 17136, "description": "Exit 14: City of Yitzhok / Playland" },
                { "x": 1512, "y": 15120, "description": "Boundary Tile 8-2/8-3" },
                { "x": 1512, "y": 11088, "description": "Boundary Tile 8-3/9" },
                { "x": 1512, "y": 9072, "description": "Exit 15: Disney St / EM Station" },
                { "x": 1512, "y": 7056, "description": "Boundary Tile 9/10" },
                { "x": 1512, "y": 5000, "description": "Exit 16: Park Village" },
                { "x": 1512, "y": 3024, "description": "Boundary Tile 10/11" },
                # Turn East at North Intersection (Tile 11)
                { "x": 1512, "y": 1512, "description": "Exit 18: Thomas Barrel Park" },
                { "x": 4032, "y": 1512, "description": "Boundary Tile 11/12" },
                { "x": 6000, "y": 1512, "description": "Exit 19: Blomns Stadium" },
                { "x": 8064, "y": 1512, "description": "Boundary Tile 12/13" },
                { "x": 12096, "y": 1512, "description": "Boundary Tile 13/14" },
                { "x": 16128, "y": 1512, "description": "Boundary Tile 14/15" },
                { "x": 20160, "y": 1512, "description": "Boundary Tile 15/16" },
                { "x": 24192, "y": 1512, "description": "Boundary Tile 16/17" },
                { "x": 28224, "y": 1512, "description": "Boundary Tile 17/18" },
                { "x": 30240, "y": 1512, "description": "Arrive at End Castle gates" }
            ]
        },

        # --- LEFT CORRIDOR (Peace-Tatty-Misnoyos-Disney Corridor, x=800) ---
        # Continuous road running north-south through the left side of the map (starts at Exit 1 y=50200)
        {
            "id": "left-corridor-1",
            "name": "Peace Ave",
            "type": "local",
            "points": [
                { "x": 800, "y": 50200 },
                { "x": 800, "y": 47376 },
                { "x": 800, "y": 43344 }
            ]
        },
        {
            "id": "left-corridor-2",
            "name": "Tatty Ave",
            "type": "local",
            "points": [
                { "x": 800, "y": 43344 },
                { "x": 800, "y": 39312 }
            ]
        },
        {
            "id": "left-corridor-3",
            "name": "Forest Ave",
            "type": "local",
            "points": [
                { "x": 800, "y": 39312 },
                { "x": 800, "y": 35280 }
            ]
        },
        {
            "id": "left-corridor-4",
            "name": "Jungle Path",
            "type": "local",
            "points": [
                { "x": 800, "y": 35280 },
                { "x": 800, "y": 27216 }
            ]
        },
        {
            "id": "left-corridor-5",
            "name": "Misnoyos Ave",
            "type": "local",
            "points": [
                { "x": 800, "y": 27216 },
                { "x": 800, "y": 23184 }
            ]
        },
        {
            "id": "left-corridor-6",
            "name": "Disneyland Way",
            "type": "local",
            "points": [
                { "x": 800, "y": 23184 },
                { "x": 800, "y": 11088 }
            ]
        },
        {
            "id": "left-corridor-7",
            "name": "Disney St",
            "type": "local",
            "points": [
                { "x": 800, "y": 11088 },
                { "x": 800, "y": 7056 }
            ]
        },
        {
            "id": "left-corridor-8",
            "name": "Park Village Rd",
            "type": "local",
            "points": [
                { "x": 800, "y": 7056 },
                { "x": 800, "y": 3024 }
            ]
        },

        # --- RIGHT CORRIDOR (Chana Rochel-Shira-Ephraim-Shobbos-Internet-Yitzhok Corridor, x=2200) ---
        # Note: Starts at Exit 1 y=50200 as Chana Rochel Ave
        {
            "id": "right-corridor-1a",
            "name": "Chana Rochel Ave",
            "type": "local",
            "points": [
                { "x": 2200, "y": 50200 },
                { "x": 2200, "y": 49400 }
            ]
        },
        {
            "id": "right-corridor-1b",
            "name": "Shira Ave",
            "type": "local",
            "points": [
                { "x": 2200, "y": 49400 },
                { "x": 2200, "y": 47376 }
            ]
        },
        {
            "id": "right-corridor-2",
            "name": "Ephraim Ave",
            "type": "local",
            "points": [
                { "x": 2200, "y": 47376 },
                { "x": 2200, "y": 43344 }
            ]
        },
        {
            "id": "right-corridor-3",
            "name": "Shobbos Blvd",
            "type": "local",
            "points": [
                { "x": 2200, "y": 43344 },
                { "x": 2200, "y": 35280 }
            ]
        },
        {
            "id": "right-corridor-4",
            "name": "Jungle Way",
            "type": "local",
            "points": [
                { "x": 2200, "y": 35280 },
                { "x": 2200, "y": 27216 }
            ]
        },
        {
            "id": "right-corridor-5",
            "name": "Internet Ave",
            "type": "local",
            "points": [
                { "x": 2200, "y": 27216 },
                { "x": 2200, "y": 23184 }
            ]
        },
        {
            "id": "right-corridor-6",
            "name": "Yitzhok Ave",
            "type": "local",
            "points": [
                { "x": 2200, "y": 23184 },
                { "x": 2200, "y": 19152 }
            ]
        },
        {
            "id": "right-corridor-7",
            "name": "Yitzhok Way",
            "type": "local",
            "points": [
                { "x": 2200, "y": 19152 },
                { "x": 2200, "y": 11088 }
            ]
        },
        {
            "id": "right-corridor-8",
            "name": "Chocolate Way",
            "type": "local",
            "points": [
                { "x": 2200, "y": 11088 },
                { "x": 2200, "y": 7056 }
            ]
        },
        {
            "id": "right-corridor-9",
            "name": "Park East Rd",
            "type": "local",
            "points": [
                { "x": 2200, "y": 7056 },
                { "x": 2200, "y": 3024 }
            ]
        },

        # --- HORIZONTAL CONNECTORS (Cross-streets in Map 1 grid, starting at y=50200) ---
        {
            "id": "messy-st",
            "name": "Messy St",
            "type": "local",
            "points": [
                { "x": 800, "y": 50200, "description": "West link on Peace Ave" },
                { "x": 1512, "y": 50200, "description": "Junction with Mommy Ave Exit 1" },
                { "x": 2200, "y": 50200, "description": "East link on Chana Rochel Ave" },
                { "x": 2600, "y": 50200, "description": "Connect to Channel Rd" }
            ]
        },
        {
            "id": "laughing-st",
            "name": "Laughing St",
            "type": "local",
            "points": [
                { "x": 800, "y": 49800 },
                { "x": 2200, "y": 49800 },
                { "x": 2600, "y": 49800 }
            ]
        },
        {
            "id": "silly-st",
            "name": "Silly St",
            "type": "local",
            "points": [
                { "x": 800, "y": 49400 },
                { "x": 2200, "y": 49400 },
                { "x": 2600, "y": 49400 }
            ]
        },
        {
            "id": "playing-rd",
            "name": "Playing Rd",
            "type": "local",
            "points": [
                { "x": 400, "y": 49000 },
                { "x": 800, "y": 49000 },
                { "x": 1512, "y": 49000 },
                { "x": 2200, "y": 49000 },
                { "x": 2600, "y": 49000 }
            ]
        },
        {
            "id": "channel-rd",
            "name": "Channel Rd",
            "type": "local",
            "points": [
                { "x": 2600, "y": 50200 },
                { "x": 2600, "y": 49800 },
                { "x": 2600, "y": 49400 },
                { "x": 2600, "y": 47376 }
            ]
        },
        {
            "id": "funny-st",
            "name": "Funny St",
            "type": "local",
            "points": [
                { "x": 2500, "y": 50200 },
                { "x": 2500, "y": 49800 }
            ]
        },
        {
            "id": "crying-rd",
            "name": "Crying Rd",
            "type": "local",
            "points": [
                { "x": 1800, "y": 50200 },
                { "x": 1800, "y": 49400 }
            ]
        },

        # Tile 2:
        {
            "id": "happy-st",
            "name": "Happy St",
            "type": "local",
            "points": [
                { "x": 600, "y": 45144 },
                { "x": 800, "y": 45144 },
                { "x": 1512, "y": 45144, "description": "Junction with Mommy Ave" },
                { "x": 2200, "y": 45144 },
                { "x": 2400, "y": 45144 }
            ]
        },
        {
            "id": "white-house-loop",
            "name": "White House Village Dr",
            "type": "local",
            "points": [
                { "x": 1512, "y": 45144 },
                { "x": 1512, "y": 43900 }
            ]
        },

        # Tile 3:
        {
            "id": "excursion-rd",
            "name": "Excursion Rd",
            "type": "local",
            "points": [
                { "x": 400, "y": 41328 },
                { "x": 800, "y": 41328 },
                { "x": 1512, "y": 41328 },
                { "x": 2200, "y": 41328 },
                { "x": 2600, "y": 41328 }
            ]
        },

        # Tile 4:
        {
            "id": "river-rd",
            "name": "River Rd",
            "type": "local",
            "points": [
                { "x": 400, "y": 37280 },
                { "x": 800, "y": 37280 },
                { "x": 1512, "y": 37280 },
                { "x": 2200, "y": 37280 },
                { "x": 2600, "y": 37280 }
            ]
        },

        # Tile 7:
        {
            "id": "chavrusa-ave",
            "name": "Chavrusa Ave",
            "type": "local",
            "points": [
                { "x": 800, "y": 25184 },
                { "x": 1512, "y": 25184 },
                { "x": 2200, "y": 25184 }
            ]
        },

        # Tile 8-1:
        {
            "id": "fun-st",
            "name": "Fun St",
            "type": "local",
            "points": [
                { "x": 500, "y": 21100 },
                { "x": 800, "y": 21100 },
                { "x": 1512, "y": 21100 },
                { "x": 2200, "y": 21100 }
            ]
        },

        # --- TILE 11/12/13 LOCAL ROADS (Rochelle Stadium / North Complex) ---
        {
            "id": "toys-r-us-blvd",
            "name": "Toys R Us Blvd",
            "type": "local",
            "points": [
                { "x": 500, "y": 2200 },
                { "x": 800, "y": 2200 },
                { "x": 1512, "y": 2200 },
                { "x": 2200, "y": 2200 },
                { "x": 3500, "y": 2200 }
            ]
        },
        {
            "id": "barrel-rd",
            "name": "Barrel Rd",
            "type": "local",
            "points": [
                { "x": 1512, "y": 500, "description": "Entrance to Thomas Barrel Park" },
                { "x": 1512, "y": 1512, "description": "Connect to Mommy Ave Freeway" }
            ]
        },
        {
            "id": "stadium-way",
            "name": "Stadium Way",
            "type": "local",
            "points": [
                { "x": 6000, "y": 500, "description": "Entrance to Blomns Stadium" },
                { "x": 6000, "y": 1512, "description": "Connect to Mommy Ave Freeway Exit 19" },
                { "x": 6000, "y": 2500 }
            ]
        }
    ]

    landmarks = [
        # --- SOUTHERN LANDMARKS (Tile 1 & 2) ---
        {
            "id": "south-harbor",
            "name": "South Harbor",
            "description": "The seaside fishing harbor at the very south end of Mommy Ave.",
            "x": 1512,
            "y": 51200,
            "icon": "Anchor"
        },
        {
            "id": "chana-rochel-city",
            "name": "City of Chana Rochel",
            "description": "A quiet residential community located south of Shira.",
            "x": 2200,
            "y": 50000,
            "icon": "Home"
        },
        {
            "id": "shira-town",
            "name": "City of Shira",
            "description": "A bustling downtown grid with local stores, playing fields, and avenues.",
            "x": 2200,
            "y": 48500,
            "icon": "School"
        },
        {
            "id": "white-house",
            "name": "The White House",
            "description": "A large mansion and gardens located at the top of White House Village Drive.",
            "x": 1512,
            "y": 43900,
            "icon": "Home"
        },

        # --- ROUTE LANDMARKS (Tile 3 - 10) ---
        {
            "id": "midpoint-bridge",
            "name": "Midpoint Rope Bridge",
            "description": "A wooden suspension bridge spanning a deep mountain canyon on Mommy Ave.",
            "x": 1512,
            "y": 25184,
            "icon": "Route"
        },
        {
            "id": "volcano-ridge",
            "name": "Volcano Ridge",
            "description": "Active volcano vents spitting steam, accessible via Volcano Road.",
            "x": 1512,
            "y": 28500,
            "icon": "Mountain"
        },
        {
            "id": "park-village",
            "name": "Park Village",
            "description": "A peaceful forest community surrounded by tall pine trees.",
            "x": 1512,
            "y": 5000,
            "icon": "Tent"
        },
        {
            "id": "playland",
            "name": "Welcome to Disneyland",
            "description": "Welcome to Disneyland! Entry gates and main parking area.",
            "x": 800,
            "y": 21100,
            "icon": "Gamepad"
        },
        {
            "id": "imax",
            "name": "IMax Theater",
            "description": "A massive screen movie theater showcasing educational and fun films.",
            "x": 1200,
            "y": 21100,
            "icon": "Film"
        },
        {
            "id": "spaceship",
            "name": "Space Ship",
            "description": "Interactive astronaut and space vehicle exhibit building.",
            "x": 1600,
            "y": 21100,
            "icon": "Rocket"
        },
        {
            "id": "city-of-yitzhok",
            "name": "City of Yitzhok",
            "description": "City of Yitzhok residential district and municipal offices.",
            "x": 2200,
            "y": 19500,
            "icon": "Building"
        },
        {
            "id": "em-station",
            "name": "EM Station",
            "description": "Ephraim Memorial Subway & Rail transit hub station.",
            "x": 800,
            "y": 9000,
            "icon": "Train"
        },
        {
            "id": "chocolate-factory",
            "name": "Chocolate Factory",
            "description": "A delightful chocolate production facility with public tours.",
            "x": 2200,
            "y": 9000,
            "icon": "Cookie"
        },
        {
            "id": "obturnal-lake",
            "name": "Obturnal Lake",
            "description": "A beautiful deep blue lake suitable for fishing and boating recreation.",
            "x": 2000,
            "y": 9072,
            "icon": "Compass"
        },

        # --- NORTHERN/EASTERN LANDMARKS (Tile 11 - 18) ---
        {
            "id": "thomas-barrelpark",
            "name": "Thomas Barrel Park",
            "description": "Located at the north end of Barrel Rd.",
            "x": 1512,
            "y": 500,
            "icon": "Star"
        },
        {
            "id": "toys-r-us",
            "name": "Toys 'R' Us Mega Store",
            "description": "A massive toy store at the corner of Toys R Us Blvd.",
            "x": 1000,
            "y": 2200,
            "icon": "Coffee"
        },
        {
            "id": "blomns-stadium",
            "name": "Blomns Stadium",
            "description": "The municipal stadium with parking, concession stands, and football field grids.",
            "x": 6000,
            "y": 500,
            "icon": "Flag"
        },
        {
            "id": "end-castle",
            "name": "End Castle",
            "description": "The majestic stone castle marking the eastern edge of the known world.",
            "x": 30240,
            "y": 1512,
            "icon": "Castle"
        }
    ]

    # Save to file
    data = {
        "tiles": tiles,
        "landmasses": landmasses,
        "roads": roads,
        "landmarks": landmarks
    }
    
    with open('src/data/map-data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print("Successfully generated rich map-data.json!")

if __name__ == '__main__':
    generate_map_data()
