import React, { FC } from 'react'
import hydrate from 'next-mdx-remote/hydrate'
import { majorScale, Pane, Heading, Spinner } from 'evergreen-ui'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Post } from '../../types'
import Container from '../../components/container'
import HomeNav from '../../components/homeNav'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BlogPost: FC<Post> = ({ source, frontMatter }) => {
  const content = hydrate(source)
  const router = useRouter()

  if (router.isFallback) {
    return (
      <Pane width="100%" height="100%">
        <Spinner size={48} />
      </Pane>
    )
  }
  return (
    <Pane>
      <Head>
        <title>{`Known Blog | ${frontMatter.title}`}</title>
        <meta name="description" content={frontMatter.summary} />
      </Head>
      <header>
        <HomeNav />
      </header>
      <main>
        <Container>
          <Heading fontSize="clamp(2rem, 8vw, 6rem)" lineHeight="clamp(2rem, 8vw, 6rem)" marginY={majorScale(3)}>
            {frontMatter.title}
          </Heading>
          <Pane>{content}</Pane>
        </Container>
      </main>
    </Pane>
  )
}

export function getStaticPaths() {
  const postsPath = path.join(process.cwd(), 'posts')
  const fileNames = fs.readdirSync(postsPath)

  const slugs = fileNames.map((name) => {
    const fullPath = path.join(process.cwd(), name)
    const file = fs.readFileSync(fullPath, 'utf-8')
    const { data } = matter(file)
    return data
  })

  return { paths: slugs.map((s) => ({ params: { slug: s.slug } })), fallback: false }
}

export function getStaticProps() {}

export default BlogPost
