import React, { FC, useState } from 'react'
import { getSession, useSession } from 'next-auth/client'
import { Pane, Dialog, majorScale } from 'evergreen-ui'
import { useRouter } from 'next/router'
import Logo from '../../components/logo'
import FolderList from '../../components/folderList'
import NewFolderButton from '../../components/newFolderButton'
import { connectToDB, folder, doc } from '../../db'
import { UserSession } from '../../types'
import User from '../../components/user'
import FolderPane from '../../components/folderPane'
import DocPane from '../../components/docPane'
import NewFolderDialog from '../../components/newFolderDialog'

const App: FC<{ newSession: any; folders?: any[]; activeFolder?: any; activeDoc?: any; activeDocs?: any[] }> = ({
  newSession,
  folders,
  activeDoc,
  activeFolder,
  activeDocs,
}) => {
  const router = useRouter()
  const [session, loading] = useSession()

  const [newFolderIsShown, setIsShown] = useState(false)
  const [allFolders, setFolders] = useState(folders || [])

  if (loading) return null

  const handleNewFolder = async (name: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/folder/`, {
      method: 'POST',
      body: JSON.stringify({ name }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const { data } = await res.json()
    setFolders((state) => [...state, data])
  }

  const Page = () => {
    if (activeDoc) {
      return <DocPane folder={activeFolder} doc={activeDoc} />
    }

    if (activeFolder) {
      return <FolderPane folder={activeFolder} docs={activeDocs} />
    }

    return null
  }

  if (!session && !loading) {
    return (
      <Dialog
        isShown
        title="Session expired"
        confirmLabel="Ok"
        hasCancel={false}
        hasClose={false}
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEscapePress={false}
        onConfirm={() => router.push('/signin')}
      >
        Sign in to continue
      </Dialog>
    )
  }

  return (
    <Pane position="relative">
      <Pane width={300} position="absolute" top={0} left={0} background="tint2" height="100vh" borderRight>
        <Pane padding={majorScale(2)} display="flex" alignItems="center" justifyContent="space-between">
          <Logo />

          <NewFolderButton onClick={() => setIsShown(true)} />
        </Pane>
        <Pane>
          <FolderList folders={allFolders} />
        </Pane>
      </Pane>
      <Pane marginLeft={300} width="calc(100vw - 300px)" height="100vh" overflowY="auto" position="relative">
        <User user={newSession.user} />
        <Page />
      </Pane>
      <NewFolderDialog close={() => setIsShown(false)} isShown={newFolderIsShown} onNewFolder={handleNewFolder} />
    </Pane>
  )
}

/*
 * Catch all handler. Must handle all different page
 * states.
 * 1. Folders - none selected
 * 2. Folders => Folder selected
 * 3. Folders => Folder selected => Document selected
 *
 * An unauth user should not be able to access this page.
 *
 * @param context
 */

export async function getServerSideProps(context) {
  const session: any = await getSession(context)

  if (!session || !session.user) {
    return { props: {} }
  }

  const props: any = {}

  props.newSession = {
    user: {
      id: session.userId,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  }

  const { db } = await connectToDB()
  const folders = await folder.getFolders(db, session.userId)

  if (context.params.id.length) {
    props.activeFolder = folders.find((f) => f._id === context.params.id[0])
    props.activeDocs = await doc.getDocsByFolder(db, props.activeFolder._id)

    if (context.params.id > 1) {
      props.activeDoc = await props.activeDocs.find((d) => d._id === context.params.id[2])
    }
  }

  return {
    props,
  }
}

export default App
