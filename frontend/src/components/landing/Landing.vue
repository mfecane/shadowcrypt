<template>
    <Header2 />
    <div class="hero">
        <div class="container">
            <div class="plaque">
                <h1>Fuel Your Artistic Vision</h1>
                <h2>Seamlessly collect and store reference images</h2>
                <p>
                    Brought to you by the legendary mastermind of frontend development
                    <a href="https://mfecane.github.io " class="href">mfecane</a>
                    himself
                </p>
                <button class="btn">Start building your library</button>
            </div>

        </div>
    </div>
    <div class="container descr">
        <p>
            ArtRefCollect is a specialized platform designed to cater to the needs of artists by providing a user-friendly
            and efficient solution for collecting and storing reference images. Whether you're an illustrator, painter,
            sculptor, or any other type of visual artist, ArtRefCollect aims to streamline your creative process by offering
            a centralized hub for managing and organizing your reference materials.
        </p>
        <h2>Key Features:</h2>
        <ul>
            <li>
                <h3>Intuitive Image Collection:</h3>

                Effortlessly collect and organize reference images based on themes, categories, or projects.
                User-friendly interface for easy navigation and management of your image library.
                Robust Search Functionality:
            </li>

            <li>
                <h3>Robust Search Functionality:</h3>

                Advanced search options to quickly find specific reference images.
                Filter images by tags, colors, or content to tailor your search results.
            </li>

            <li>
                <h3>Cloud Storage:</h3>

                Securely store your reference images in the cloud for easy access from any device.
                Unlimited storage space to accommodate your growing collection.
            </li>

            <li>
                <h3>Tagging and Annotation:</h3>

                Add custom tags and annotations to your images for detailed organization.
                Mark key points or elements in an image for quick reference during the creative process.
            </li>

            <li>
                <h3>Privacy Controls:</h3>

                Choose between public and private settings for your reference boards.
                Maintain control over who can view and interact with your collection.
            </li>

            <li>
                <h3>Mobile Accessibility:</h3>

                Access your reference images on the go with a mobile-friendly interface.
                Capture and upload images directly from your mobile device.
            </li>

            <li>
                <h3>Offline Mode:</h3>

                Download reference images for offline use when an internet connection is not available.
                Ensure uninterrupted access to your references during your creative sessions.
            </li>

            <li>
                <h3>Community Features:</h3>

                Connect with a community of artists to share insights, tips, and inspiration.
                Participate in challenges or themed events to spark creativity.
            </li>

            <li>
                <h3>Regular Updates and Support:</h3>

                Receive updates with new features and improvements to enhance your experience.
                Responsive customer support to address any queries or issues promptly.
            </li>
        </ul>
    </div>
</template>
  
<script setup lang="ts">

import { useRouter } from 'vue-router';

import Header2 from '@/components/common/Header2.vue'
import { useAuth } from '@/hooks/useAuth';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';

const router = useRouter()
const { user } = storeToRefs(useAuth())

watch(user, (user) => {
    if (user) {
        router.push('/list')
    }
})

</script>
  
<style scoped lang="scss">
.hero {
    height: 500px;
    min-height: 35vw;
    position: relative;

    &:before {

        content: "";
        position: absolute;
        z-index: -1;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: center 45% / cover url(/assets/images/pussy.jpg) no-repeat;
        transform: scaleX(-1);
    }

    .container {
        height: 100%;
        padding-top: 20px;
        padding-bottom: 20px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-start;
    }
}


.plaque {
    border-radius: 10px;
    padding: 40px 50px;
    backdrop-filter: blur(10px) brightness(50%);
    margin-bottom: 2rem;
    max-width: 540px;

    p {
        color: var(--color-light);
        margin-bottom: 2rem;
    }


    h1 {
        font-size: 3rem;
        font-weight: 500;
        color: var(--accent-color);
        margin-bottom: 0.5rem;
        line-height: 3rem;
    }

    h2 {
        font-size: 2rem;
        font-weight: 500;
        color: var(--color-light);
        margin-bottom: 2rem;
    }
}


.plaque button {
    padding-left: 3rem;
    padding-right: 3rem;
}

.descr {
    color: var(--color-light);
    padding-top: 60px;
    padding-bottom: 100px;
    font-size: 1.2rem;
    line-height: 2.2rem;
    font-weight: normal;

    p,
    li {
        margin: 20px 0;

        h3 {
            margin-bottom: 1.2rem;
            font-weight: 500;
            font-size: 1.3rem
        }
    }

    h2 {
        font-size: 2rem;
        font-weight: 500;
    }
}
</style>
