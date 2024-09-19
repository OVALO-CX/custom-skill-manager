import React from 'react';
import { Autocomplete, Box, Card, Divider, IconButton, Sheet, Typography } from '@mui/joy';
import DeleteIcon from '@mui/icons-material/Delete';
import { Rating } from '@mui/material';
import { getAllQueues, getAllSkills, getAllUsers, getQueueMembers, getUserSkills, updateUserRoutingSkills } from '../../utils/genesysCloudUtils';
import { Models } from 'purecloud-platform-client-v2';


function CustomSkills() {
  const [queues, setQueues] = React.useState([])
  const [skills, setSkills] = React.useState([])
  const [users, setUsers] = React.useState<Models.User[]>([])
  const [usersSelected, setUsersSelected] = React.useState<Models.User[]>([])
  const [queueUsers, setQueueUsers] = React.useState<Models.User[]>([])
  const [elementsSelected, setElementsSelected] = React.useState<Models.User[]>([])

  React.useEffect(() => {
    getAllQueues().then(queues => setQueues(queues))
    getAllSkills().then(skills => setSkills(skills))
    getAllUsers().then(users => setUsers(users))
  }, [])

  const getUsers = (users : Models.User[]) => {
    if(!users || users.length == 0) {
      setUsersSelected([])
      setElementsSelected([...queueUsers])
    }
    setUsersSelected(users)
    if(users.length > usersSelected.length) {
      const newUser = users.find((user: any) => !usersSelected.find((usr: any) => usr.id == user.id))
      if(!newUser || elementsSelected.find(element => element.id == newUser.id)) {
        return
      }
      getUserSkills(newUser.id || '').then((userSkills) => {
        setElementsSelected([...elementsSelected,{
          id: newUser.id,
          name: newUser.name,
          skills: userSkills,
          version: 1
        }])
      })
    } else if(users.length < usersSelected.length) {
      const oldUser = usersSelected.find(user => !users.find((usr: any) => usr.id == user.id))
      if(!oldUser || queueUsers.find(usr => usr.id == oldUser.id)) {
        return
      }
      setElementsSelected([...elementsSelected.filter(member => member.id != oldUser.id)])
    }

  }

  const getQueueUsers = (queue: Models.Queue) => {
    if(!queue) {
      setElementsSelected([...usersSelected])
      setQueueUsers([])
      return
    }
    getQueueMembers(queue.id || '').then(mmbrs => {
      const usrs: any = mmbrs.map(mmbr => mmbr.user).filter(usr => usr != undefined)
      setQueueUsers(usrs)
      setElementsSelected([...elementsSelected.filter(element => !queueUsers.find(queueUsr => queueUsr.id == element.id)), ...usrs.filter((mmbr:any) => !elementsSelected.find(element => element?.id == mmbr.id))])
    })
  }

  const updateGroupMember = (userId : string, skills: any) => {
    updateUserRoutingSkills(userId, skills)
  }

  return (
      <Sheet sx={{
          backgroundColor: 'white'
        }}><Sheet  sx={{
          p: 2,
        }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
        <Autocomplete
        placeholder="Users"
        multiple
        value={usersSelected}
        size='sm'
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
        onChange={(_, selected: any) => getUsers(selected)}
        options={users}
        sx={{ width: 300 }}
      /><Autocomplete
      placeholder="Queues"
      size='sm'
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
      onChange={(_, selected: any) => getQueueUsers(selected)}
      options={queues}
      sx={{ width: 300, height: 20 }}
    /></Box><Divider sx={{mt: 2,mb: -2, mx: -2}}/></Sheet>
      
      <Box sx={{ display: 'flex', gap: 1, p:1, flexDirection: 'column' }}>
        {elementsSelected.map((member: any) => <Card key={member.id}  sx={{p:1}}><Box sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
          <Typography level='title-sm'>{member.name}</Typography>
          <Autocomplete
            placeholder="Ajouter une compétence"
            size='sm'
            value={[]}
            multiple
            getOptionLabel={(option: any) => option?.name}
            isOptionEqualToValue={(option: any, value: any) => option.id == value.id}
            onChange={(_, selected: any) => {
              const element = selected &&  selected[0]
              selected && setElementsSelected([...elementsSelected.filter((skll: any) => skll.id != element.id).map((mbr: any) => {
              if(mbr.skills && mbr.id == member.id) {
                updateGroupMember(member.id, [...mbr.skills, {...element, proficiency: 0}])
                return {...mbr, skills: [...mbr.skills, element]}
              }
              return mbr
            })])}}
            options={skills.filter((skill: any) => member.skills && !member.skills.find((skll: any) => skll.id == skill.id))}
            sx={{ width: 300 }}
          />
       </Box>
       <Divider/>
       {member.skills && member.skills.sort((a: any,b: any) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map((skill: any) => 
       <Box key={skill.id} sx={{ display: 'flex', gap: 2,  }} justifyContent="space-between" alignItems='center'>
        <Typography sx={{width: 500}} level='body-sm'>{skill.name}</Typography>
        <Rating
          size='small'
          name="simple-controlled"
          onChange={(_, value) => {
            setElementsSelected([...elementsSelected.map((mbr: any) => {
              if(mbr.id == member.id) {
                updateGroupMember(member.id, [...mbr.skills.filter((skll: any) => skll.id != skill.id), {...skill, proficiency: value}])
                return {...mbr, skills: [...mbr.skills.filter((skll: any) => skll.id != skill.id), {...skill, proficiency: value}]}
              }
              return mbr
            })])
          }}
          value={skill.proficiency}
          />
        <IconButton aria-label="delete" color='danger' variant='plain' size='sm' onClick={() => {
          setElementsSelected([...elementsSelected.map((mbr: any) => {
            if(mbr.id == member.id) {
              updateGroupMember(member.id, [...mbr.skills.filter((skll: any) => skll.id != skill.id)])
              return {...mbr, skills: [...mbr.skills.filter((skll: any) => skll.id != skill.id)]}
            }
            return mbr
          })])
        }}>
          <DeleteIcon />
        </IconButton>
        </Box>)}
        </Card>)}
      </Box>
      </Sheet>
  );
}

export default CustomSkills;
