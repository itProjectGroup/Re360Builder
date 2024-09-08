import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { TourCreatorComponent } from '../tour-creator/tour-creator.component';


//Parent
// @Component({
//   selector: 'app-builder-dashboard',
//   templateUrl: './builder-dashboard.component.html',
//   styleUrls: ['./builder-dashboard.component.scss']
// })

@Component({
  selector: 'app-builder-dashboard',
  template: `
    <ng-template #container></ng-template>
    <!-- Navbar -->
    <nav class="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div class="flex items-center">
        <img src="path_to_logo.png" alt="Marzipano Logo" class="h-8 mr-2">
        <span class="text-xl font-bold">Marzipano</span>
      </div>
      <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
        Export
      </button>
    </nav>

    <!-- Main content -->
    <div class="flex h-[calc(100vh-64px)]">
      <!-- Section 1: Settings and Panorama List -->
      <div class="w-1/4 bg-gray-200 p-4 overflow-y-auto">
        <h2 class="text-lg font-bold mb-4">Settings</h2>
        <div class="mb-4">
          <label class="block mb-2">
            <input type="radio" name="controlMode" value="drag" checked> Drag
          </label>
          <label class="block mb-2">
            <input type="radio" name="controlMode" value="qtvr"> QTVR
          </label>
        </div>
        <div class="mb-4">
          <label class="flex items-center">
            <input type="checkbox" class="mr-2"> Autorotate
          </label>
        </div>
        <div class="mb-4">
          <label class="flex items-center">
            <input type="checkbox" class="mr-2"> View control buttons
          </label>
        </div>
        <div class="mb-4">
          <label class="flex items-center">
            <input type="checkbox" class="mr-2"> Fullscreen button
          </label>
        </div>

        <h2 class="text-lg font-bold mb-4">Panorama List</h2>
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 w-full">
          Add more panoramas
        </button>
        <div class="bg-white p-2 mb-2 rounded">
          <div class="flex justify-between items-center">
            <span>panorama_320911F4...</span>
            <button class="text-red-500 hover:text-red-600">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="text-green-500">Successfully processed</div>
        </div>
        <!-- Add more panorama items here -->
      </div>

      <!-- Section 2: 360 Image Display -->
      <div class="w-1/2 bg-gray-100 p-4">
        <div id="panorama-container" class="w-full h-full bg-gray-300 flex items-center justify-center">
          <!-- Panorama will be rendered here -->
          <span class="text-gray-500">360° Panorama View</span>
        </div>
      </div>

      <!-- Section 3: Options -->
      <div class="w-1/4 bg-gray-200 p-4">
        <h2 class="text-lg font-bold mb-4">Options</h2>
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2 w-full">
          Set initial view
        </button>
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2 w-full">
          Add hotspot
        </button>
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-2 w-full">
          Add information spot
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* You can add any additional styles here if needed */
  `]
})


export class BuilderDashboardComponent implements OnInit {

  @ViewChild('container', { read: ViewContainerRef, static: true }) container!: ViewContainerRef;
  constructor() { }

  ngOnInit(): void {
    this.loadChild();
  }

  loadChild() {
    this.container.clear();  // Clear any existing component in the container

    const componentRef = this.container.createComponent(TourCreatorComponent);

    // Pass data to the dynamically loaded component
    componentRef.instance.dataFromParent = 'Hello from Parent!';
  }

}
