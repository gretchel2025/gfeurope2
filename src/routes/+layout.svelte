<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';

  let isMenuOpen = false;
  let starContainer: HTMLDivElement;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }
  onMount(() => {
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      Object.assign(star.style, {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDuration: `${2 + Math.random() * 3}s`
      });
      starContainer?.appendChild(star);
    }

    });

  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.querySelector('.nav-links');
      const hamburger = document.querySelector('.hamburger');
      if (
        menu &&
        hamburger &&
        !menu.contains(event.target as Node) &&
        !hamburger.contains(event.target as Node)
      ) {
        isMenuOpen = false;
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>
<!-- Aurora Background -->
<div class="aurora-bg">
  <div class="stars" bind:this={starContainer}></div>
  <div class="aurora aurora-1"></div>
  <div class="aurora aurora-2"></div>
  <div class="aurora aurora-3"></div>
  <div class="aurora aurora-4"></div>
</div>

 <header class="relative z-10 py-6 px-4 md:px-8">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
      <a href="/"><h1 class="text-2xl font-bold text-white tracking-wider">Grand Feast EU UK</h1></a> 
      <nav class="mt-4 md:mt-0">
        <ul class="flex space-x-6 {`nav-links ${isMenuOpen ? 'show' : ''}`}>">
          <!-- <button class="close-button" on:click={closeMenu}>&times;</button> -->
          <li><a href="/" on:click={closeMenu}>Home</a></li>
          <li><a href="/#speakers" class="text-blue-200 hover:text-white transition">Speakers</a></li>
          <li><a href="/#details" class="text-blue-200 hover:text-white transition">Details</a></li>
          <li><a href="/newbooking" on:click={closeMenu}>Buy Tickets</a></li>
          <!-- <li><a href="/api" on:click={closeMenu}>Organizers</a></li> -->
        </ul>
      </nav>
    </div>
  </header>

<slot />
